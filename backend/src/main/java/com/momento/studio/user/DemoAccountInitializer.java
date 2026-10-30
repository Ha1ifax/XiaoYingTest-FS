package com.momento.studio.user;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 为原有两个策展身份补齐登录凭据；新注册用户不受影响。
 */
@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class DemoAccountInitializer implements ApplicationRunner {

    private static final String DEMO_PASSWORD = "momento123";

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        List<DemoAccount> accounts = List.of(
                new DemoAccount("u_lin", "lin@momento.studio"),
                new DemoAccount("u_chen", "chen@momento.studio")
        );
        for (DemoAccount account : accounts) {
            userMapper.findById(account.userId()).ifPresent(user -> {
                if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
                    int updated = userMapper.seedCredentials(
                            user.getId(),
                            account.email(),
                            passwordEncoder.encode(DEMO_PASSWORD)
                    );
                    if (updated > 0) {
                        userMapper.updateRole(user.getId(), UserRole.ADMIN, LocalDateTime.now());
                        log.info("Seeded demo login for {}", account.email());
                    }
                }
            });
        }
    }

    private record DemoAccount(String userId, String email) {
    }
}
