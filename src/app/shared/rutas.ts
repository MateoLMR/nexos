// La base de datos guarda las imágenes como "/Imagenes/x.png". En GitHub Pages el sitio vive en
// /nexos/, así que una ruta que empieza con "/" busca fuera de esa carpeta. Se vuelve relativa.
// Las URL completas (https://…) y las que empiezan con "//" se dejan igual.
export function rutaLocal(ruta: string): string {
  if (!ruta || !ruta.startsWith('/') || ruta.startsWith('//')) return ruta;
  return ruta.slice(1);
}
