import { AuthProvider } from '../context/AuthContext';
import Layout from '../components/layout/Layout'; // ruta relativa correcta

export const metadata = {
  title: 'AulaConectaPy',
  description: 'Aplicación educativa',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <Layout>{children}</Layout>
        </AuthProvider>
      </body>
    </html>
  );
}
