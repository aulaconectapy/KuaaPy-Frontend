"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import StudentForm from "@/components/StudenForm";

const EditStudentPage = ({ params }) => {
  const router = useRouter();
  const [studentId, setStudentId] = useState(null);

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params; // Resolver params como Promise
      setStudentId(resolvedParams.id); // Acceder a la propiedad id
    };

    resolveParams();
  }, [params]);

  const handleSuccess = () => {
    router.push("/user/students");
  };

  return (
    <div>
      <h1>Editar Estudiante</h1>
      {studentId ? (
        <StudentForm studentId={studentId} onSuccess={handleSuccess} />
      ) : (
        <p>Cargando...</p>
      )}
    </div>
  );
};

export default EditStudentPage;
