package com.momento.studio.user;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Mapper
public interface UserMapper {

    String COLUMNS = "id, display_name, initials, role, role_key, email, password_hash, created_at, updated_at";

    @Select("SELECT " + COLUMNS + " FROM app_user ORDER BY created_at, id")
    List<AppUser> findAll();

    @Select("SELECT " + COLUMNS + " FROM app_user WHERE id = #{id}")
    Optional<AppUser> findById(String id);

    @Select("SELECT " + COLUMNS + " FROM app_user WHERE LOWER(email) = LOWER(#{email})")
    Optional<AppUser> findByEmail(String email);

    @Insert("""
            INSERT INTO app_user
                (id, display_name, initials, role, role_key, email, password_hash, created_at, updated_at)
            VALUES
                (#{id}, #{displayName}, #{initials}, #{role}, #{roleKey}, #{email}, #{passwordHash}, #{createdAt}, #{updatedAt})
            """)
    int insert(AppUser user);

    @Update("UPDATE app_user SET display_name = #{displayName}, initials = #{initials}, updated_at = #{updatedAt} WHERE id = #{id}")
    int updateProfile(@Param("id") String id,
                      @Param("displayName") String displayName,
                      @Param("initials") String initials,
                      @Param("updatedAt") LocalDateTime updatedAt);

    @Update("UPDATE app_user SET password_hash = #{passwordHash}, updated_at = #{updatedAt} WHERE id = #{id}")
    int updatePassword(@Param("id") String id,
                       @Param("passwordHash") String passwordHash,
                       @Param("updatedAt") LocalDateTime updatedAt);

    @Update("UPDATE app_user SET email = #{email}, password_hash = #{passwordHash} WHERE id = #{id} AND password_hash IS NULL")
    int seedCredentials(@Param("id") String id,
                        @Param("email") String email,
                        @Param("passwordHash") String passwordHash);

    @Update("UPDATE app_user SET role_key = #{roleKey}, updated_at = #{updatedAt} WHERE id = #{id}")
    int updateRole(@Param("id") String id,
                   @Param("roleKey") UserRole roleKey,
                   @Param("updatedAt") LocalDateTime updatedAt);

    @Select("SELECT COUNT(*) FROM app_user WHERE role_key = 'ADMIN'")
    int countAdmins();
}
