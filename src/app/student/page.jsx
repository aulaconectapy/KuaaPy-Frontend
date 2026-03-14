'use client';

import { useEffect, useState } from 'react';
import { getMyTasks } from '@/services/api';
import {
  Container,
  Typography,
  Box,
  Paper
} from '@mui/material';

export default function StudentClasses() {

  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await getMyTasks();
        setTasks(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchTasks();
  }, []);

  return (
    <Container sx={{ mt: 5 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Mis Estados Académicos
      </Typography>

      {tasks.map(task => (
        <Paper key={task._id} sx={{ p: 3, mb: 2 }}>
          <Typography variant="h6">
            {task.task.title}
          </Typography>

          <Typography>
            Estado: {task.status}
          </Typography>

          <Typography>
            Nota: {task.score}
          </Typography>
        </Paper>
      ))}
    </Container>
  );
}