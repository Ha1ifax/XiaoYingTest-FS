package com.momento.studio.config;

import com.momento.studio.auth.AuthSessionFilter;
import com.momento.studio.common.ApiException;
import com.momento.studio.user.AppUser;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

@Component
public class CurrentUserArgumentResolver implements HandlerMethodArgumentResolver {

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(CurrentUser.class)
                && AppUser.class.isAssignableFrom(parameter.getParameterType());
    }

    @Override
    public Object resolveArgument(MethodParameter parameter,
                                  ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest,
                                  WebDataBinderFactory binderFactory) {
        Object user = webRequest.getAttribute(AuthSessionFilter.USER_ATTRIBUTE, RequestAttributes.SCOPE_REQUEST);
        if (user instanceof AppUser appUser) {
            return appUser;
        }
        throw ApiException.unauthorized("请先登录后再继续。");
    }
}
