import { AuthProvider } from '../context/AuthContext';
import Layout from '../components/layout/Layout'; // ruta relativa correcta
import { NotificationProvider } from '../context/NotificationContext'; // <-- AÑADE ESTA LÍNEA
export const metadata = {
  title: 'CPMA',
  description: 'Campus virtual Colegio Privado María Auxiliadora',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <NotificationProvider> {/* <-- Nuevo */}
            <Layout>{children}</Layout>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}