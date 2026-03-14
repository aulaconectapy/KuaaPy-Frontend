"use client";
import { useRouter } from "next/navigation";
import StudentForm from "@/components/StudenForm"

const NewStudentPage = () => {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/user/students"); // Redirigir a la lista de estudiantes
  };

  return (
    <div>
      <h1>Crear Estudiante</h1>
      <StudentForm onSuccess={handleSuccess} />
    </div>
  );
};

export default NewStudentPage;
