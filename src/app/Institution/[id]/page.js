"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getInstitutionById } from '@/services/api';
import InstitutionForm from '@/components/InstitutionForm';

const EditInstitution = ({ params }) => {
  const router = useRouter();
  const [id, setId] = useState(null); // Almacenamos el ID extraído
  const [institution, setInstitution] = useState(null);

  useEffect(() => {
    const resolveParams = async () => {
      const unwrappedParams = await params; // Desenrollamos los params
      setId(unwrappedParams.id); // Extraemos el ID
    };

    resolveParams();
  }, [params]);

  useEffect(() => {
    if (id) {
      const fetchInstitution = async () => {
        try {
          const institutionData = await getInstitutionById(id);
          setInstitution(institutionData);
        } catch (error) {
          console.error('Error al obtener la institución:', error);
        }
      };

      fetchInstitution();
    }
  }, [id]);

  if (!institution) return <p>Cargando...</p>;

  return <InstitutionForm existingInstitution={institution} />;
};

export default EditInstitution;
