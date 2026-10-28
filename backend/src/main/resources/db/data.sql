SET NAMES utf8mb4;

INSERT IGNORE INTO app_user (id, display_name, initials, role) VALUES
    ('u_lin', '林小满', 'LM', '创意工作室主理人'),
    ('u_chen', '陈一舟', 'CY', '独立摄影师');

INSERT IGNORE INTO creative_template
    (id, title, category, description, cover_url, accent_color, required_image_count,
     accepted_mime_types, max_file_size_bytes, result_label, detail_note, sort_order)
VALUES
    ('demo-postcard', '旅行明信片', '创意图片',
     '把一路上的风景与同行的人，收进一张有温度的旅行明信片。',
     '/demo/postcard-cover.jpg', '#BF5A3A', 2, 'image/jpeg,image/png', 5242880,
     'TRAVEL NOTES', '双图叙事构图，适合公路、海岸和城市漫游。系统会模拟生成一张 4:5 的旅行主题成品。', 10),
    ('demo-coffee', '咖啡时光海报', '商业海报',
     '为你的咖啡馆或周末手冲时刻，做一张安静而有质感的海报。',
     '/demo/coffee-cover.jpg', '#8A6846', 1, 'image/jpeg,image/png', 4194304,
     'SLOW MORNING', '单图留白构图，适合器物、空间与生活方式场景。成品会保留照片的呼吸感。', 20),
    ('demo-pet', '宠物纪念卡', '纪念卡片',
     '三张照片，记下小家伙最可爱的几个瞬间。',
     '/demo/pet-cover.jpg', '#A76D53', 3, 'image/jpeg,image/png', 5242880,
     'LITTLE COMPANION', '三图拼贴会突出照片之间的节奏，建议准备一张正脸、一张动作和一张细节。', 30),
    ('demo-podcast', '本周播客封面', '声音封面',
     '用一张照片，为本周节目做一期新鲜封面。',
     '/demo/podcast-cover.jpg', '#5E6961', 1, 'image/jpeg,image/png', 3145728,
     'ON AIR / 07', '单图封面会加入播客版式与刊头，适合人物、录音室或与主题相关的静物。', 40),
    ('demo-summer', '夏日胶片拼贴', '创意图片',
     '海水、树影与朋友的笑脸，拼成一卷不肯结束的夏天。',
     '/demo/summer-cover.jpg', '#3F746D', 3, 'image/jpeg,image/png', 6291456,
     'SUMMER ROLL', '三图自由拼贴，适合色彩明亮的旅行与日常记录。单张最大 6 MB。', 50),
    ('demo-brand', '品牌故事长图', '商业海报',
     '把你的品牌起点、工作现场与坚持，讲成一张有画面的故事长图。',
     '/demo/brand-cover.jpg', '#7D5A49', 2, 'image/jpeg,image/png', 5242880,
     'OUR STORY', '双图叙事版式，适合品牌主理人、工作室与手作品牌。', 60),
    ('demo-birthday', '生日花笺', '纪念卡片',
     '为重要的人留一张小花笺，认真说一句生日快乐。',
     '/demo/birthday-cover.jpg', '#B86B66', 1, 'image/jpeg,image/png', 4194304,
     'HAPPY DAY', '单图柔光版式，适合人像、花束和生日现场。', 70);
