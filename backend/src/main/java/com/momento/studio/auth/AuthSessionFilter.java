package com.momento.studio.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
@RequiredArgsConstructor
public class AuthSessionFilter extends OncePerRequestFilter {

    public static final String USER_ATTRIBUTE = AuthSessionFilter.class.getName() + ".user";

    private final AuthCookieService cookieService;
    private final AuthService authService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        cookieService.read(request)
                .flatMap(authService::resolve)
                .ifPresent(user -> request.setAttribute(USER_ATTRIBUTE, user));
        filterChain.doFilter(request, response);
    }
}
