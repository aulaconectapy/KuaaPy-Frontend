import { AuthProvider } from '../context/AuthContext';
import Layout from '../components/layout/Layout'; // ruta relativa correcta

export const metadata = {
  title: 'CPMA',
  description: 'Campus virtual Colegio Privado María Auxiliadora',
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
