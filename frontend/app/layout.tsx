import type { Metadata, Viewport } from "next";
import { Providers } from "@/lib/providers";
import { SiteShell } from "@/components/site-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MOMENTO 片刻制所 · 把照片做成值得收藏的片刻",
    template: "%s · MOMENTO",
  },
  description:
    "挑选模板、上传照片，交给后台完成素材检查、模拟生成与结果整理。MOMENTO 是一个完全本地运行的模拟素材制作工作台。",
  applicationName: "MOMENTO 片刻制所",
  keywords: ["素材制作", "模板", "图片", "模拟生成", "MOMENTO"],
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#faf5f1",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>
          <SiteShell>{children}</SiteShell>
        </Providers>
      </body>
    </html>
  );
}
