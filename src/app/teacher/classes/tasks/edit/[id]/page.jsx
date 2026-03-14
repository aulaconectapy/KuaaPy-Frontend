'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTaskById } from "@/services/api";
import TaskForm from "@/components/teacher/TaskForm";
import { CircularProgress, Box } from "@mui/material";

export default function EditTaskPage() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const data = await getTaskById(id);
        setTask(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchTask();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return <TaskForm task={task} />;
}