import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Button, CircularProgress, Typography, Snackbar } from '@mui/material';

const FileUploader = ({ onUpload, existingImageUrl }) => {
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(existingImageUrl || '');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (existingImageUrl) setImageUrl(existingImageUrl);
  }, [existingImageUrl]);

  useEffect(() => {
    return () => {
      if (image) URL.revokeObjectURL(image);
    };
  }, [image]);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile || !selectedFile.type.startsWith('image/')) {
      setError('Por favor, selecciona un archivo de imagen válido.');
      return;
    }
    
    setImage(selectedFile);
    setError(null);
    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('upload_preset', 'productos_imagenes');

    try {
      const response = await axios.post('https://api.cloudinary.com/v1_1/dymjqs9mz/image/upload', formData);
      const data = response.data;
      setImageUrl(data.secure_url);
      onUpload(data.secure_url);
      setSuccessMessage('Imagen subida con éxito');
    } catch (err) {
      setError('Error al subir la imagen. Inténtalo nuevamente.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 3 }}>
      {imageUrl ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mb: 2 }}>
          <img 
            src={imageUrl} 
            alt="Logo" 
            style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'cover' }} 
          />
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={() => setImageUrl('')} 
          >
            Cambiar Logo
          </Button>
        </Box>
      ) : (
        <>
          <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} id="file-input" />
          
          <label htmlFor="file-input">
            <Button variant="contained" component="span" sx={{ mb: 2 }} disabled={uploading}>
              {uploading ? <CircularProgress size={24} /> : 'Seleccionar Logo'}
            </Button>
          </label>
        </>
      )}
      {error && <Typography color="error" variant="body2">{error}</Typography>}
      <Snackbar open={!!successMessage} autoHideDuration={3000} onClose={() => setSuccessMessage('')} message={successMessage} />
    </Box>
  );
};

export default FileUploader;
