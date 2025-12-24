import toast from "react-hot-toast";
import NotificationToast from "@/app/components/toast/NotificationToast";

export function showNotification({
  title = "Notification",
  message = "",
  image = null,
  type = "info",
}) {
  toast.custom((t) => (
    <NotificationToast
      t={t}
      title={title}
      message={message}
      image={image}
      type={type}
    />
  ));
}
