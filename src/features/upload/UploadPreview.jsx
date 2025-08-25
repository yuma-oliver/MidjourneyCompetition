import { useMainView } from "@/contexts/MainViewContext";

export default function UploadPreview({ file }) {
  const { setView } = useMainView();

  return (
    <div>
      <h2>アップロード内容確認</h2>
      <img
        src={URL.createObjectURL(file)}
        alt="preview"
        style={{ maxWidth: "200px" }}
      />
      <div>
        <button onClick={() => setView("voting")}>投票画面へ</button>
      </div>
    </div>
  );
}
