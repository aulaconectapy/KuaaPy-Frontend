import { Card, CardContent, Typography, Chip, Stack } from '@mui/material';

const TaskCard = ({ task }) => {
  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography fontWeight="bold">{task.subject}</Typography>
        <Typography variant="body2">{task.topic}</Typography>

        <Stack direction="row" spacing={1} mt={1}>
          <Chip label={task.grade} />
          <Chip label={task.status} color="warning" />
        </Stack>

        <Typography variant="caption" display="block" mt={1}>
          Entrega: {new Date(task.deliveryDate).toLocaleDateString()}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
