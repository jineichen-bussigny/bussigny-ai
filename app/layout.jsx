export const metadata = {
  title: "Bussigny AI",
  description: "Générateur multicanal pour la Ville de Bussigny",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}