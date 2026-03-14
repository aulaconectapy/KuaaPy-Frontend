"use client";

import { Container } from "@mui/material";
import { useRouter } from "next/navigation";
import TaskForm from "@/components/teacher/TaskForm";

export default function CreateTaskPage() {
  const router = useRouter();

  return (
    <Container sx={{ mt: 4 }}>
      <TaskForm onSuccess={() => router.push("/teacher/classes")} />
    </Container>
  );
}
