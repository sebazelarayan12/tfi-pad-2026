/** `errorElement` del router: evita la pantalla en blanco si una ruta falla al cargar. */
export function ErrorRuta() {
  return (
    <main className="flex min-h-screen items-center justify-center p-sp-24">
      <p role="alert" className="text-text-primary">
        Algo salió mal. Volvé a intentarlo.
      </p>
    </main>
  );
}
