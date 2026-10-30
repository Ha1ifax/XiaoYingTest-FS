package com.momento.studio.auth;

import com.momento.studio.common.ApiException;
import com.momento.studio.config.AppProperties;
import com.momento.studio.user.AppUser;
import com.momento.studio.user.UserMapper;
import com.momento.studio.user.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

import static com.momento.studio.auth.AuthDtos.ChangePasswordRequest;
import static com.momento.studio.auth.AuthDtos.LoginRequest;
import static com.momento.studio.auth.AuthDtos.RegisterRequest;
import static com.momento.studio.auth.AuthDtos.UpdateProfileRequest;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int MAX_PASSWORD_BYTES = 72;

    private final UserMapper userMapper;
    private final AuthSessionMapper sessionMapper;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties properties;

    @Transactional
    public AuthResult register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        String displayName = request.displayName().trim();
        ensurePasswordFits(request.password());

        if (userMapper.findByEmail(email).isPresent()) {
            throw ApiException.conflict("这个邮箱已经注册过了，可以直接登录。");
        }

        LocalDateTime now = LocalDateTime.now();
        AppUser user = new AppUser();
        user.setId("u_" + UUID.randomUUID().toString().replace("-", "").substring(0, 20));
        user.setDisplayName(displayName);
        user.setInitials(initialsFor(displayName));
        user.setRole("独立创作者");
        user.setRoleKey(UserRole.MEMBER);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setCreatedAt(now);
        user.setUpdatedAt(now);

        try {
            userMapper.insert(user);
        } catch (DuplicateKeyException exception) {
            throw ApiException.conflict("这个邮箱已经注册过了，可以直接登录。");
        }
        return new AuthResult(user, createSession(user.getId()));
    }

    @Transactional
    public AuthResult login(LoginRequest request) {
        AppUser user = userMapper.findByEmail(normalizeEmail(request.email()))
                .orElseThrow(() -> ApiException.unauthorized("邮箱或密码不正确。"));
        if (user.getPasswordHash() == null
                || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw ApiException.unauthorized("邮箱或密码不正确。");
        }
        return new AuthResult(user, createSession(user.getId()));
    }

    public Optional<AppUser> resolve(String rawToken) {
        if (!StringUtils.hasText(rawToken)) return Optional.empty();
        return sessionMapper.findUserByToken(hashToken(rawToken));
    }

    public void logout(String rawToken) {
        if (StringUtils.hasText(rawToken)) {
            sessionMapper.delete(hashToken(rawToken));
        }
    }

    @Transactional
    public AppUser updateProfile(AppUser current, UpdateProfileRequest request) {
        String displayName = request.displayName().trim();
        userMapper.updateProfile(current.getId(), displayName, initialsFor(displayName), LocalDateTime.now());
        return userMapper.findById(current.getId())
                .orElseThrow(() -> ApiException.unauthorized("账号不存在，请重新登录。"));
    }

    @Transactional
    public void changePassword(AppUser current, String rawToken, ChangePasswordRequest request) {
        AppUser stored = userMapper.findById(current.getId())
                .orElseThrow(() -> ApiException.unauthorized("账号不存在，请重新登录。"));
        if (stored.getPasswordHash() == null
                || !passwordEncoder.matches(request.currentPassword(), stored.getPasswordHash())) {
            throw ApiException.badRequest("当前密码不正确。");
        }
        if (passwordEncoder.matches(request.newPassword(), stored.getPasswordHash())) {
            throw ApiException.badRequest("新密码不能和当前密码相同。");
        }
        ensurePasswordFits(request.newPassword());
        userMapper.updatePassword(
                stored.getId(),
                passwordEncoder.encode(request.newPassword()),
                LocalDateTime.now()
        );
        // 改密后让其它设备上的会话立即失效，保留当前浏览器。
        sessionMapper.deleteOtherSessions(stored.getId(), hashToken(rawToken));
    }

    private String createSession(String userId) {
        sessionMapper.deleteExpiredForUser(userId);
        String token = newToken();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusDays(properties.getAuth().getSessionDays());
        sessionMapper.insert(hashToken(token), userId, now, expiresAt, now);
        return token;
    }

    private String newToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static void ensurePasswordFits(String password) {
        if (password.getBytes(StandardCharsets.UTF_8).length > MAX_PASSWORD_BYTES) {
            throw ApiException.badRequest("密码过长，请使用 72 字节以内的密码。");
        }
    }

    static String initialsFor(String displayName) {
        String cleaned = displayName.trim().replaceAll("\\s+", " ");
        String[] words = cleaned.split(" ");
        if (words.length >= 2
                && words[0].matches("[A-Za-z].*")
                && words[1].matches("[A-Za-z].*")) {
            return (words[0].substring(0, 1) + words[1].substring(0, 1)).toUpperCase(Locale.ROOT);
        }
        int[] points = cleaned.codePoints()
                .filter(point -> !Character.isWhitespace(point))
                .limit(2)
                .toArray();
        return new String(points, 0, points.length).toUpperCase(Locale.ROOT);
    }

    public record AuthResult(AppUser user, String token) {
    }
}
