import type { Metadata } from "next";
import { Suspense } from "react";
import CreationsView from "./creations-view";

export const metadata: Metadata = {
  title: "我的片刻",
  description: "查看你的制作任务、后台处理进度与已经完成的片刻作品。",
};

export default function CreationsPage() {
  return (
    <Suspense fallback={null}>
      <CreationsView />
    </Suspense>
  );
}
