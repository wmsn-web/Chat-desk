import { AuthProvider } from "@/src/AuthContext";
import { Stack } from "expo-router";

export default function Layout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#121212" }, // optional, fixes bg
        }} />
    </AuthProvider>
  );
}
