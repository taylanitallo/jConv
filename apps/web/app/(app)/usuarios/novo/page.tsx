import { FormularioUsuario } from '../_componentes/formulario-usuario';

export default function PaginaNovoUsuario() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Novo usuário</h1>
      <FormularioUsuario />
    </div>
  );
}
