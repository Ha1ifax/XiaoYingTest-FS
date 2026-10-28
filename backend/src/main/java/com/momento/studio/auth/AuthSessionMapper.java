package com.momento.studio.auth;

import com.momento.studio.user.AppUser;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.Optional;

@Mapper
public interface AuthSessionMapper {

    @Insert("""
            INSERT INTO auth_session (token_hash, user_id, created_at, expires_at, last_seen_at)
            VALUES (#{tokenHash}, #{userId}, #{createdAt}, #{expiresAt}, #{lastSeenAt})
            """)
    int insert(@Param("tokenHash") String tokenHash,
               @Param("userId") String userId,
               @Param("createdAt") LocalDateTime createdAt,
               @Param("expiresAt") LocalDateTime expiresAt,
               @Param("lastSeenAt") LocalDateTime lastSeenAt);

    @Select("""
            SELECT u.id, u.display_name, u.initials, u.role, u.is_admin AS admin,
                   u.email, u.created_at, u.updated_at
            FROM auth_session s
            JOIN app_user u ON u.id = s.user_id
            WHERE s.token_hash = #{tokenHash} AND s.expires_at > NOW(3)
            """)
    Optional<AppUser> findUserByToken(String tokenHash);

    @Delete("DELETE FROM auth_session WHERE token_hash = #{tokenHash}")
    int delete(String tokenHash);

    @Delete("DELETE FROM auth_session WHERE user_id = #{userId} AND expires_at <= NOW(3)")
    int deleteExpiredForUser(String userId);

    @Delete("DELETE FROM auth_session WHERE user_id = #{userId} AND token_hash <> #{keepTokenHash}")
    int deleteOtherSessions(@Param("userId") String userId, @Param("keepTokenHash") String keepTokenHash);
}
