package com.momento.studio.auth;

import com.momento.studio.auth.AuthDtos.AuthResponse;
import com.momento.studio.auth.AuthDtos.ChangePasswordRequest;
import com.momento.studio.auth.AuthDtos.LoginRequest;
import com.momento.studio.auth.AuthDtos.RegisterRequest;
import com.momento.studio.auth.AuthDtos.UpdateProfileRequest;
import com.momento.studio.common.ApiException;
import com.momento.studio.config.CurrentUser;
import com.momento.studio.user.AppUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuthCookieService cookieService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request,
                                                  HttpServletResponse response) {
        AuthService.AuthResult result = authService.register(request);
        response.addHeader(HttpHeaders.SET_COOKIE, cookieService.issue(result.token()).toString());
        response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
        return ResponseEntity.status(HttpStatus.CREATED).body(AuthResponse.of(result.user()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request,
                                               HttpServletResponse response) {
        AuthService.AuthResult result = authService.login(request);
        response.addHeader(HttpHeaders.SET_COOKIE, cookieService.issue(result.token()).toString());
        response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
        return ResponseEntity.ok(AuthResponse.of(result.user()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        cookieService.read(request).ifPresent(authService::logout);
        response.addHeader(HttpHeaders.SET_COOKIE, cookieService.clear().toString());
        response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> me(HttpServletRequest request) {
        AppUser user = currentUserOrNull(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(user == null ? new AuthResponse(null) : AuthResponse.of(user));
    }

    @PatchMapping("/profile")
    public ResponseEntity<AuthResponse> updateProfile(@CurrentUser AppUser user,
                                                       @Valid @RequestBody UpdateProfileRequest request) {
        AppUser updated = authService.updateProfile(user, request);
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(AuthResponse.of(updated));
    }

    @PostMapping("/password")
    public ResponseEntity<Void> changePassword(@CurrentUser AppUser user,
                                                @RequestBody @Valid ChangePasswordRequest request,
                                                HttpServletRequest servletRequest) {
        String rawToken = cookieService.read(servletRequest)
                .orElseThrow(() -> ApiException.unauthorized("登录已过期，请重新登录。"));
        authService.changePassword(user, rawToken, request);
        return ResponseEntity.noContent().build();
    }

    private AppUser currentUserOrNull(HttpServletRequest request) {
        Object value = request.getAttribute(AuthSessionFilter.USER_ATTRIBUTE);
        return value instanceof AppUser user ? user : null;
    }
}
