package com.momento.studio.task;

import com.momento.studio.asset.AssetStorageService;
import com.momento.studio.asset.UploadedAsset;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.AlphaComposite;
import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics2D;
import java.awt.GraphicsEnvironment;
import java.awt.LinearGradientPaint;
import java.awt.RenderingHints;
import java.awt.Shape;
import java.awt.geom.Ellipse2D;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class ResultComposer {

    private static final int WIDTH = 1200;
    private static final int HEIGHT = 1500;
    private static final Color PAPER = new Color(0xF4, 0xEF, 0xE6);
    private static final Color INK = new Color(0x1E, 0x1C, 0x19);
    private static final Color MUTED = new Color(0x6D, 0x66, 0x5C);
    private static final DateTimeFormatter DAY_FORMAT = DateTimeFormatter.ofPattern("yyyy.MM.dd");

    private static final String DISPLAY_FONT = chooseFont(
            "Microsoft YaHei", "Microsoft YaHei UI", "PingFang SC", "Noto Sans CJK SC", "SansSerif"
    );
    private static final String LATIN_FONT = chooseFont(
            "Segoe UI", "Helvetica Neue", "Arial", "SansSerif"
    );

    private final AssetStorageService assetStorageService;

    public String compose(CreationTask task, List<UploadedAsset> assets) throws IOException {
        if (assets.isEmpty()) {
            throw new IOException("没有可以用于整理的图片。");
        }
        List<BufferedImage> images = new ArrayList<>();
        for (UploadedAsset asset : assets) {
            BufferedImage image = ImageIO.read(Path.of(asset.getStoragePath()).toFile());
            if (image == null) {
                throw new IOException("图片无法解码：" + asset.getOriginalFileName());
            }
            images.add(image);
        }

        Color accent = parseColor(task.getAccentColor());
        BufferedImage canvas = new BufferedImage(WIDTH, HEIGHT, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = canvas.createGraphics();
        try {
            graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            graphics.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

            paintBackground(graphics, accent);
            paintHeader(graphics, task, accent);
            paintCollage(graphics, images, accent);
            paintCaption(graphics, task, accent);
            paintFooter(graphics);
        } finally {
            graphics.dispose();
        }

        Path directory = assetStorageService.resultDirectory();
        String fileName = "result_" + safeName(task.getId()) + ".png";
        Path target = directory.resolve(fileName);
        if (!ImageIO.write(canvas, "png", target.toFile())) {
            throw new IOException("PNG writer is unavailable.");
        }
        return "/results/" + fileName;
    }

    private void paintBackground(Graphics2D graphics, Color accent) {
        graphics.setColor(PAPER);
        graphics.fillRect(0, 0, WIDTH, HEIGHT);

        graphics.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.12f));
        graphics.setColor(accent);
        graphics.fill(new Ellipse2D.Double(690, -280, 820, 820));
        graphics.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.08f));
        graphics.fill(new Ellipse2D.Double(-300, 1050, 700, 700));
        graphics.setComposite(AlphaComposite.SrcOver);

        graphics.setColor(new Color(0x1E, 0x1C, 0x19, 18));
        graphics.setStroke(new BasicStroke(1f));
        for (int y = 118; y < HEIGHT; y += 96) {
            graphics.drawLine(64, y, WIDTH - 64, y);
        }
    }

    private void paintHeader(Graphics2D graphics, CreationTask task, Color accent) {
        graphics.setFont(new Font(LATIN_FONT, Font.BOLD, 20));
        graphics.setColor(INK);
        graphics.drawString("MOMENTO STUDIO", 64, 92);

        graphics.setFont(new Font(LATIN_FONT, Font.PLAIN, 16));
        graphics.setColor(MUTED);
        String edition = "CUSTOM EDITION / " + LocalDate.now().format(DAY_FORMAT);
        int editionWidth = graphics.getFontMetrics().stringWidth(edition);
        graphics.drawString(edition, WIDTH - 64 - editionWidth, 92);

        graphics.setColor(accent);
        graphics.fill(new RoundRectangle2D.Double(64, 116, 92, 5, 5, 5));
        graphics.setColor(new Color(0x1E, 0x1C, 0x19, 30));
        graphics.fill(new RoundRectangle2D.Double(164, 116, WIDTH - 228, 1, 1, 1));
    }

    private void paintCollage(Graphics2D graphics, List<BufferedImage> images, Color accent) {
        int left = 64;
        int top = 168;
        int width = WIDTH - 128;
        int height = 810;
        int gap = 16;

        if (images.size() == 1) {
            paintTile(graphics, images.get(0), left, top, width, height, 26);
        } else if (images.size() == 2) {
            int firstWidth = (int) (width * 0.61);
            paintTile(graphics, images.get(0), left, top, firstWidth, height, 26);
            paintTile(graphics, images.get(1), left + firstWidth + gap, top,
                    width - firstWidth - gap, height, 26);
        } else {
            int firstWidth = (int) (width * 0.62);
            int secondWidth = width - firstWidth - gap;
            int upperHeight = (int) (height * 0.58);
            paintTile(graphics, images.get(0), left, top, firstWidth, height, 26);
            paintTile(graphics, images.get(1), left + firstWidth + gap, top,
                    secondWidth, upperHeight, 26);
            paintTile(graphics, images.get(2), left + firstWidth + gap, top + upperHeight + gap,
                    secondWidth, height - upperHeight - gap, 26);
        }

        graphics.setFont(new Font(LATIN_FONT, Font.BOLD, 13));
        graphics.setColor(accent);
        graphics.drawString("SELECTED FRAMES  /  " + images.size(), left, top + height + 38);
        graphics.setColor(MUTED);
        String note = "IMAGES SUPPLIED BY THE MAKER";
        int noteWidth = graphics.getFontMetrics().stringWidth(note);
        graphics.drawString(note, WIDTH - 64 - noteWidth, top + height + 38);
    }

    private void paintCaption(Graphics2D graphics, CreationTask task, Color accent) {
        int left = 64;
        int base = 1110;

        graphics.setColor(accent);
        graphics.fill(new RoundRectangle2D.Double(left, base, 48, 4, 4, 4));

        graphics.setFont(new Font(DISPLAY_FONT, Font.BOLD, 14));
        graphics.setColor(MUTED);
        String category = task.getTemplateCategory() == null ? "CUSTOM EDITION" : task.getTemplateCategory();
        graphics.drawString(category + "  /  MOMENTO CUSTOM EDITION", left + 64, base + 4);

        String title = task.getTemplateTitle() == null ? "未命名作品" : task.getTemplateTitle();
        Font titleFont = fitFont(graphics, title, DISPLAY_FONT, Font.BOLD, 76, WIDTH - 128);
        graphics.setFont(titleFont);
        graphics.setColor(INK);
        graphics.drawString(title, left, base + 98);

        String resultLabel = task.getResultLabel() == null ? "一份由你亲手完成的模拟作品。" : task.getResultLabel();
        Font bodyFont = fitFont(graphics, resultLabel, DISPLAY_FONT, Font.PLAIN, 25, WIDTH - 128);
        graphics.setFont(bodyFont);
        graphics.setColor(MUTED);
        graphics.drawString(resultLabel, left, base + 146);
    }

    private void paintFooter(Graphics2D graphics) {
        int y = 1404;
        graphics.setColor(new Color(0x1E, 0x1C, 0x19, 40));
        graphics.fill(new RoundRectangle2D.Double(64, y - 42, WIDTH - 128, 1, 1, 1));

        graphics.setFont(new Font(LATIN_FONT, Font.BOLD, 13));
        graphics.setColor(INK);
        graphics.drawString("MOMENTO / KEEP THE MOMENT", 64, y);

        String note = "SIMULATED CRAFT · NO EXTERNAL AI SERVICE";
        graphics.setFont(new Font(LATIN_FONT, Font.PLAIN, 12));
        graphics.setColor(MUTED);
        int width = graphics.getFontMetrics().stringWidth(note);
        graphics.drawString(note, WIDTH - 64 - width, y);

        graphics.setFont(new Font(LATIN_FONT, Font.PLAIN, 12));
        graphics.setColor(new Color(0x6D, 0x66, 0x5C, 180));
        String serial = "NO. " + (int) (Math.abs(1_000 + (System.nanoTime() % 8_999)));
        graphics.drawString(serial, 64, y + 28);
    }

    private void paintTile(Graphics2D graphics, BufferedImage image,
                           int x, int y, int width, int height, int radius) {
        graphics.setColor(new Color(0x1E, 0x1C, 0x19, 32));
        graphics.fill(new RoundRectangle2D.Double(x + 7, y + 9, width, height, radius, radius));

        Shape oldClip = graphics.getClip();
        Shape frame = new RoundRectangle2D.Double(x, y, width, height, radius, radius);
        graphics.setClip(frame);
        drawCover(graphics, image, x, y, width, height);
        graphics.setClip(oldClip);

        graphics.setColor(new Color(0xF4, 0xEF, 0xE6, 220));
        graphics.setStroke(new BasicStroke(1.2f));
        graphics.draw(new RoundRectangle2D.Double(x + 0.5, y + 0.5, width - 1, height - 1, radius, radius));
    }

    private void drawCover(Graphics2D graphics, BufferedImage image,
                           int x, int y, int width, int height) {
        double scale = Math.max(width / (double) image.getWidth(), height / (double) image.getHeight());
        int drawWidth = (int) Math.ceil(image.getWidth() * scale);
        int drawHeight = (int) Math.ceil(image.getHeight() * scale);
        int drawX = x + (width - drawWidth) / 2;
        int drawY = y + (height - drawHeight) / 2;
        graphics.drawImage(image, drawX, drawY, drawWidth, drawHeight, null);

        graphics.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.16f));
        graphics.setPaint(new LinearGradientPaint(
                x, y + height * 0.55f, x, y + height,
                new float[]{0f, 1f},
                new Color[]{new Color(0, 0, 0, 0), new Color(0, 0, 0, 190)}
        ));
        graphics.fillRect(x, y, width, height);
        graphics.setComposite(AlphaComposite.SrcOver);
    }

    private Font fitFont(Graphics2D graphics, String text, String family, int style,
                         int preferredSize, int maxWidth) {
        int size = preferredSize;
        Font font = new Font(family, style, size);
        FontMetrics metrics = graphics.getFontMetrics(font);
        while (size > 20 && metrics.stringWidth(text) > maxWidth) {
            size -= 2;
            font = new Font(family, style, size);
            metrics = graphics.getFontMetrics(font);
        }
        return font;
    }

    private Color parseColor(String value) {
        if (value == null || !value.matches("#?[0-9a-fA-F]{6}")) {
            return new Color(0xB7, 0x5C, 0x3C);
        }
        try {
            return Color.decode(value.startsWith("#") ? value : "#" + value);
        } catch (NumberFormatException exception) {
            return new Color(0xB7, 0x5C, 0x3C);
        }
    }

    private String safeName(String value) {
        return value == null ? "image" : value.replaceAll("[^a-zA-Z0-9_-]", "");
    }

    private static String chooseFont(String... candidates) {
        try {
            Set<String> available = Set.of(
                    GraphicsEnvironment.getLocalGraphicsEnvironment().getAvailableFontFamilyNames()
            );
            for (String candidate : candidates) {
                if (available.contains(candidate)) {
                    return candidate;
                }
            }
        } catch (RuntimeException ignored) {
            // Fall back to the logical font supported by every JDK.
        }
        return Font.SANS_SERIF;
    }
}
