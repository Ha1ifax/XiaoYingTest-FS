package com.momento.studio.auth;

import com.momento.studio.config.AppProperties;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Arrays;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class AuthCookieService {

    private final AppProperties properties;

    public Optional<String> read(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null || cookies.length == 0) return Optional.empty();
        String name = properties.getAuth().getCookieName();
        return Arrays.stream(cookies)
                .filter(cookie -> name.equals(cookie.getName()))
                .map(Cookie::getValue)
                .filter(value -> !value.isBlank())
                .findFirst();
    }

    public ResponseCookie issue(String token) {
        return base(token)
                .maxAge(Duration.ofDays(properties.getAuth().getSessionDays()))
                .build();
    }

    public ResponseCookie clear() {
        return base("").maxAge(Duration.ZERO).build();
    }

    private ResponseCookie.ResponseCookieBuilder base(String value) {
        return ResponseCookie.from(properties.getAuth().getCookieName(), value)
                .httpOnly(true)
                .secure(properties.getAuth().isCookieSecure())
                .sameSite("Lax")
                .path("/");
    }
}
