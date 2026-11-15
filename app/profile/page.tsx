import BottomNav from "@/components/ui/BottomNav";
import ProfileView from "@/components/views/ProfileView";

// Legacy direct route — the SPA shell (app/page.tsx) renders the same view in the "You" tab
export default function ProfilePage() {
  return (
    <>
      <ProfileView />
      <BottomNav />
    </>
  );
}
