import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/user");
  }, []);

  return <div>Redirecting...</div>;
}
