package com.momento.studio.user;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;

    public List<AppUser> findAll() {
        return userMapper.findAll();
    }

    public Optional<AppUser> findById(String id) {
        return userMapper.findById(id);
    }
}
