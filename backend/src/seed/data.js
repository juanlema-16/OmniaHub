// Datos inventados para la demo. Ningún nombre, DPI, teléfono ni correo es real.

export const PASSWORD_DEMO = 'Demo123*';

export const placeholder = (texto, size = '600x600') =>
  `https://placehold.co/${size}/EEF2FF/4F46E5/png?text=${encodeURIComponent(texto)}`;

export const USERS = {
  admin: {
    nombre: 'Sofía',
    apellido: 'Castillo',
    email: 'admin@omniahub.test',
    telefono: '55510001',
    role: 'admin',
  },
  proveedor: {
    nombre: 'Carlos',
    apellido: 'Méndez',
    email: 'proveedor@omniahub.test',
    telefono: '55510002',
    role: 'proveedor',
    empresa: { nombre: 'Distribuidora Maya', nit: '1234567-8', bodega: 'Mixco' },
  },
  proveedor2: {
    nombre: 'Lucía',
    apellido: 'Rodríguez',
    email: 'proveedor2@omniahub.test',
    telefono: '55510003',
    role: 'proveedor',
    empresa: { nombre: 'Importadora Quetzal', nit: '2345678-9', bodega: 'Villa Nueva' },
  },
  dropshipper: {
    nombre: 'Diego',
    apellido: 'Herrera',
    email: 'dropshipper@omniahub.test',
    telefono: '55510004',
    role: 'dropshipper',
    tienda: { nombre: 'Tienda Demo', slug: 'tienda-demo', logo: placeholder('TD', '200x200') },
  },
  nuevo: {
    nombre: 'Valeria',
    apellido: 'López',
    email: 'nuevo@omniahub.test',
    telefono: '55510005',
    role: 'dropshipper',
    tienda: { nombre: 'Estilo Chapín', slug: 'estilo-chapin', logo: placeholder('EC', '200x200') },
  },
  rutaexpress: {
    nombre: 'Marco',
    apellido: 'Pérez',
    email: 'rutaexpress@omniahub.test',
    telefono: '55510006',
    role: 'transportadora',
    empresa: { nombre: 'RutaExpress', nit: '3456789-0', bodega: 'Guatemala' },
  },
  velozgt: {
    nombre: 'Ana',
    apellido: 'García',
    email: 'velozgt@omniahub.test',
    telefono: '55510007',
    role: 'transportadora',
    empresa: { nombre: 'Veloz GT', nit: '4567890-1', bodega: 'Guatemala' },
  },
  cliente: {
    nombre: 'María',
    apellido: 'Gómez',
    email: 'cliente@omniahub.test',
    telefono: '55510008',
    role: 'cliente',
  },
  // Clientes extra para que las reseñas del seed sean de personas distintas
  luis: { nombre: 'Luis', apellido: 'Morales', email: 'luis@omniahub.test', telefono: '55520003', role: 'cliente' },
  karla: { nombre: 'Karla', apellido: 'Estrada', email: 'karla@omniahub.test', telefono: '55520004', role: 'cliente' },
  andrea: { nombre: 'Andrea', apellido: 'Pineda', email: 'andrea@omniahub.test', telefono: '55520005', role: 'cliente' },
  jose: { nombre: 'José', apellido: 'Ramírez', email: 'jose@omniahub.test', telefono: '55520001', role: 'cliente' },
};

export const CATEGORIES = [
  { nombre: 'Tecnología', slug: 'tecnologia', icono: 'Smartphone' },
  { nombre: 'Hogar y cocina', slug: 'hogar-y-cocina', icono: 'Home' },
  { nombre: 'Belleza y cuidado', slug: 'belleza-y-cuidado', icono: 'Sparkles' },
  { nombre: 'Moda y accesorios', slug: 'moda-y-accesorios', icono: 'Shirt' },
  { nombre: 'Deportes y fitness', slug: 'deportes-y-fitness', icono: 'Dumbbell' },
  { nombre: 'Mascotas', slug: 'mascotas', icono: 'PawPrint' },
];

// prov: 1 = proveedor@, 2 = proveedor2@
export const PRODUCTS = [
  { nombre: 'Audífonos Bluetooth TWS', cat: 'tecnologia', pp: 85, ps: 149, stock: 70, prov: 1, desc: 'Audífonos inalámbricos con estuche de carga, 20 horas de batería y micrófono integrado.' },
  { nombre: 'Smartwatch deportivo', cat: 'tecnologia', pp: 160, ps: 279, stock: 60, prov: 1, desc: 'Reloj inteligente con monitor de ritmo cardíaco, pasos, sueño y notificaciones.' },
  { nombre: 'Cargador rápido 20W USB-C', cat: 'tecnologia', pp: 45, ps: 89, stock: 100, prov: 1, desc: 'Cargador de pared con carga rápida PD de 20W, compatible con la mayoría de teléfonos.' },
  { nombre: 'Bocina portátil resistente al agua', cat: 'tecnologia', pp: 120, ps: 219, stock: 4, prov: 2, desc: 'Bocina Bluetooth IPX6 con 12 horas de reproducción y luces LED.' },
  { nombre: 'Licuadora portátil recargable', cat: 'hogar-y-cocina', pp: 95, ps: 169, stock: 45, prov: 1, desc: 'Licuadora personal de 380 ml con 6 cuchillas y carga USB.' },
  { nombre: 'Organizador de cocina giratorio', cat: 'hogar-y-cocina', pp: 55, ps: 99, stock: 80, prov: 2, desc: 'Organizador de 360° para especias y condimentos, ahorra espacio.' },
  { nombre: 'Set de 6 contenedores herméticos', cat: 'hogar-y-cocina', pp: 70, ps: 129, stock: 55, prov: 1, desc: 'Contenedores libres de BPA con tapa hermética, aptos para microondas.' },
  { nombre: 'Lámpara LED de escritorio', cat: 'hogar-y-cocina', pp: 80, ps: 149, stock: 35, prov: 2, desc: 'Lámpara con 3 tonos de luz, brillo ajustable y puerto de carga USB.' },
  { nombre: 'Cepillo alisador eléctrico', cat: 'belleza-y-cuidado', pp: 110, ps: 199, stock: 40, prov: 1, desc: 'Cepillo alisador con cerámica iónica y control de temperatura.' },
  { nombre: 'Set de brochas de maquillaje 12 pzs', cat: 'belleza-y-cuidado', pp: 50, ps: 95, stock: 90, prov: 2, desc: 'Brochas de cerdas sintéticas suaves con estuche de viaje.' },
  { nombre: 'Sérum facial de vitamina C', cat: 'belleza-y-cuidado', pp: 40, ps: 85, stock: 120, prov: 1, desc: 'Sérum iluminador con vitamina C y ácido hialurónico, 30 ml.' },
  { nombre: 'Masajeador facial de jade', cat: 'belleza-y-cuidado', pp: 35, ps: 75, stock: 3, prov: 2, desc: 'Rodillo de jade natural para masaje facial y drenaje.' },
  { nombre: 'Mochila antirrobo con puerto USB', cat: 'moda-y-accesorios', pp: 115, ps: 209, stock: 30, prov: 1, desc: 'Mochila impermeable con cierre oculto y compartimento para laptop de 15".' },
  { nombre: 'Gorra deportiva ajustable', cat: 'moda-y-accesorios', pp: 30, ps: 65, stock: 150, prov: 2, desc: 'Gorra transpirable con ajuste trasero, disponible en varios colores.' },
  { nombre: 'Lentes de sol polarizados', cat: 'moda-y-accesorios', pp: 45, ps: 99, stock: 75, prov: 1, desc: 'Lentes polarizados con protección UV400 y estuche.' },
  { nombre: 'Bandas de resistencia set de 5', cat: 'deportes-y-fitness', pp: 40, ps: 89, stock: 110, prov: 1, desc: 'Cinco bandas de látex con distintos niveles de resistencia.' },
  { nombre: 'Botella térmica de acero 750 ml', cat: 'deportes-y-fitness', pp: 50, ps: 99, stock: 65, prov: 2, desc: 'Mantiene bebidas frías 24 h y calientes 12 h. Acero inoxidable.' },
  { nombre: 'Tapete de yoga antideslizante', cat: 'deportes-y-fitness', pp: 75, ps: 149, stock: 40, prov: 1, desc: 'Tapete de 6 mm con superficie antideslizante y correa para cargar.' },
  { nombre: 'Cama ortopédica para perro', cat: 'mascotas', pp: 140, ps: 249, stock: 20, prov: 2, desc: 'Cama de espuma viscoelástica con funda lavable, talla mediana.' },
  { nombre: 'Bebedero automático para gatos', cat: 'mascotas', pp: 90, ps: 169, stock: 50, prov: 1, desc: 'Fuente de agua de 2.5 L con filtro y funcionamiento silencioso.' },
];

// Índices de PRODUCTS importados a la tienda demo, con su precio de venta
export const STORE_PRODUCTS = [
  { idx: 0, precioVenta: 149 },
  { idx: 1, precioVenta: 279 },
  { idx: 2, precioVenta: 89 },
  { idx: 4, precioVenta: 169 },
  { idx: 6, precioVenta: 129 },
  { idx: 8, precioVenta: 199 },
  { idx: 9, precioVenta: 95 },
  { idx: 10, precioVenta: 79 },
  { idx: 12, precioVenta: 209 },
  { idx: 15, precioVenta: 89 },
  { idx: 17, precioVenta: 149 },
  { idx: 19, precioVenta: 169 },
];

// Zona de envío por departamento: 0 = capital, 4 = más lejano
export const ZONAS = {
  Guatemala: 0,
  Sacatepéquez: 1,
  Chimaltenango: 1,
  Escuintla: 1,
  'El Progreso': 1,
  'Santa Rosa': 1,
  'Baja Verapaz': 2,
  Jalapa: 2,
  Jutiapa: 2,
  Sololá: 2,
  Totonicapán: 2,
  Quetzaltenango: 2,
  Suchitepéquez: 2,
  Retalhuleu: 2,
  Chiquimula: 2,
  Zacapa: 2,
  'Alta Verapaz': 3,
  Huehuetenango: 3,
  Quiché: 3,
  'San Marcos': 3,
  Izabal: 3,
  Petén: 4,
};

export const CARRIERS = {
  rutaexpress: { nombre: 'RutaExpress', precios: [25, 32, 38, 45, 55], dias: [1, 2, 2, 3, 4] },
  velozgt: { nombre: 'Veloz GT', precios: [28, 30, 40, 42, 60], dias: [1, 1, 2, 3, 3] },
};

const CLIENTE_DEMO = { nombres: 'María', apellidos: 'Gómez', telefono: '55510008', email: 'cliente@omniahub.test', esUsuario: true };

// Órdenes de la tienda demo. diasAtras = cuándo se creó; estado = estado final.
export const ORDERS = [
  { estado: 'ENTREGADO', diasAtras: 12, producto: 1, cantidad: 1, precioVenta: 279, carrier: 'rutaexpress', tipoPago: 'CON_RECAUDO', cliente: { nombres: 'José', apellidos: 'Ramírez', telefono: '55520001', usuario: 'jose' }, destino: { departamento: 'Alta Verapaz', municipio: 'Cobán', direccion: '3a. calle 4-15, zona 1', referencias: 'Frente al parque central' } },
  { estado: 'DEVOLUCION', diasAtras: 10, producto: 17, cantidad: 1, precioVenta: 149, carrier: 'rutaexpress', tipoPago: 'CON_RECAUDO', cliente: { nombres: 'Rosa', apellidos: 'Chávez', telefono: '55520002' }, destino: { departamento: 'Petén', municipio: 'Flores', direccion: 'Calle Centroamérica, casa 12', referencias: 'Portón negro' } },
  { estado: 'ENTREGADO', diasAtras: 9, producto: 0, cantidad: 2, precioVenta: 149, carrier: 'rutaexpress', tipoPago: 'CON_RECAUDO', origen: 'TIENDA', cliente: CLIENTE_DEMO, destino: { departamento: 'Guatemala', municipio: 'Guatemala', direccion: '6a. avenida 10-20, zona 10', referencias: 'Edificio Torre Azul, apto 502' } },
  { estado: 'ENTREGADO', diasAtras: 8, producto: 6, cantidad: 1, precioVenta: 129, carrier: 'velozgt', tipoPago: 'CON_RECAUDO', cliente: { nombres: 'Luis', apellidos: 'Morales', telefono: '55520003', usuario: 'luis' }, destino: { departamento: 'Chimaltenango', municipio: 'Chimaltenango', direccion: '1a. calle 2-30, zona 2', referencias: 'Cerca del mercado' } },
  { estado: 'ENTREGADO', diasAtras: 7, producto: 15, cantidad: 3, precioVenta: 89, carrier: 'velozgt', tipoPago: 'SIN_RECAUDO', cliente: { nombres: 'Karla', apellidos: 'Estrada', telefono: '55520004', email: 'karla@omniahub.test', usuario: 'karla' }, destino: { departamento: 'Guatemala', municipio: 'Villa Nueva', direccion: 'Residenciales Las Flores, casa 8', referencias: 'Garita principal' } },
  { estado: 'ENTREGADO', diasAtras: 6, producto: 9, cantidad: 2, precioVenta: 95, carrier: 'rutaexpress', tipoPago: 'CON_RECAUDO', cliente: { nombres: 'Andrea', apellidos: 'Pineda', telefono: '55520005', usuario: 'andrea' }, destino: { departamento: 'Izabal', municipio: 'Puerto Barrios', direccion: '8a. calle y 5a. avenida', referencias: 'Tienda La Esquina' } },
  { estado: 'CANCELADO', diasAtras: 5, producto: 19, cantidad: 1, precioVenta: 169, carrier: 'velozgt', tipoPago: 'CON_RECAUDO', cliente: { nombres: 'Pedro', apellidos: 'Juárez', telefono: '55520006' }, destino: { departamento: 'Zacapa', municipio: 'Zacapa', direccion: 'Barrio El Centro, 4a. calle', referencias: 'Casa amarilla' } },
  { estado: 'NOVEDAD', diasAtras: 4, producto: 12, cantidad: 1, precioVenta: 209, carrier: 'rutaexpress', tipoPago: 'CON_RECAUDO', novedad: 'Cliente ausente', cliente: { nombres: 'Fernando', apellidos: 'Barrios', telefono: '55520007' }, destino: { departamento: 'Huehuetenango', municipio: 'Huehuetenango', direccion: '2a. avenida 5-40, zona 1', referencias: 'A la par de la farmacia' } },
  { estado: 'EN_TRANSITO', diasAtras: 3, producto: 8, cantidad: 1, precioVenta: 199, carrier: 'velozgt', tipoPago: 'CON_RECAUDO', cliente: { nombres: 'Gabriela', apellidos: 'Cruz', telefono: '55520008' }, destino: { departamento: 'Escuintla', municipio: 'Escuintla', direccion: '7a. calle 3-10, zona 1', referencias: 'Frente a la escuela' } },
  { estado: 'GUIA_GENERADA', diasAtras: 2, producto: 4, cantidad: 2, precioVenta: 169, carrier: 'rutaexpress', tipoPago: 'CON_RECAUDO', cliente: { nombres: 'Ricardo', apellidos: 'Ortiz', telefono: '55520009' }, destino: { departamento: 'Quetzaltenango', municipio: 'Quetzaltenango', direccion: '14 avenida 6-25, zona 3', referencias: 'Colonia Minerva' } },
  { estado: 'PENDIENTE', diasAtras: 1, producto: 1, cantidad: 1, precioVenta: 279, carrier: 'velozgt', tipoPago: 'CON_RECAUDO', cliente: { nombres: 'Daniela', apellidos: 'Sosa', telefono: '55520010' }, destino: { departamento: 'Sacatepéquez', municipio: 'Antigua Guatemala', direccion: '5a. avenida norte 20', referencias: 'Cerca del Arco' } },
  { estado: 'PENDIENTE_CONFIRMACION', diasAtras: 0, producto: 0, cantidad: 1, precioVenta: 149, carrier: 'rutaexpress', tipoPago: 'CON_RECAUDO', origen: 'TIENDA', cupon: true, cliente: CLIENTE_DEMO, destino: { departamento: 'Guatemala', municipio: 'Mixco', direccion: 'Colonia El Naranjo, 3a. calle 8-12', referencias: 'Casa con portón blanco' } },
  { estado: 'ENTREGADO', diasAtras: 5, producto: 4, cantidad: 1, precioVenta: 169, carrier: 'velozgt', tipoPago: 'CON_RECAUDO', origen: 'TIENDA', cliente: { nombres: 'Luis', apellidos: 'Morales', telefono: '55520003', usuario: 'luis' }, destino: { departamento: 'Chimaltenango', municipio: 'Chimaltenango', direccion: '1a. calle 2-30, zona 2', referencias: 'Cerca del mercado' } },
  { estado: 'ENTREGADO', diasAtras: 4, producto: 8, cantidad: 1, precioVenta: 199, carrier: 'rutaexpress', tipoPago: 'CON_RECAUDO', origen: 'TIENDA', cliente: { nombres: 'Karla', apellidos: 'Estrada', telefono: '55520004', email: 'karla@omniahub.test', usuario: 'karla' }, destino: { departamento: 'Guatemala', municipio: 'Villa Nueva', direccion: 'Residenciales Las Flores, casa 8', referencias: 'Garita principal' } },
];

export const POLICIES = [
  {
    slug: 'terminos-y-condiciones',
    titulo: 'Términos y condiciones',
    contenido: `## 1. Aceptación
Al crear una cuenta en OmniaHub aceptas estos términos. Si no estás de acuerdo, no uses la plataforma.

## 2. Cuentas
Cada persona es responsable de la información que registra y de mantener segura su contraseña. Proveedores y dropshippers deben completar la verificación de identidad (KYC) para publicar, vender y retirar fondos.

## 3. Productos y precios
El proveedor es responsable de la descripción, el stock y el precio proveedor de sus productos. El dropshipper define su precio de venta, que nunca puede ser menor al precio proveedor.

## 4. Comisión
OmniaHub cobra una comisión configurable sobre el total de cada orden entregada. La comisión vigente se muestra al crear cada orden.

## 5. Billetera
Los saldos solo cambian mediante transacciones registradas. Los retiros requieren datos bancarios verificados y están sujetos a un monto mínimo.

## 6. Suspensión
OmniaHub puede bloquear cuentas que incumplan estos términos o realicen actividades fraudulentas.`,
  },
  {
    slug: 'privacidad',
    titulo: 'Política de privacidad',
    contenido: `## Datos que recopilamos
Nombre, correo, teléfono, dirección de entrega y, para proveedores y dropshippers, documentos de identidad para la verificación KYC.

## Para qué los usamos
Para procesar pedidos, coordinar envíos, emitir facturas, verificar identidades y prevenir fraudes.

## Con quién los compartimos
Solo con los participantes necesarios para completar un pedido: proveedor, dropshipper y transportadora. Nunca vendemos tus datos.

## Tus derechos
Puedes solicitar acceso, corrección o eliminación de tus datos escribiendo a soporte desde tu panel.`,
  },
  {
    slug: 'cookies',
    titulo: 'Política de cookies',
    contenido: `## ¿Qué son las cookies?
Son pequeños archivos que el navegador guarda para recordar información entre visitas.

## Cookies que usamos
- **Necesarias:** mantienen tu sesión iniciada y tu carrito de compras.
- **Preferencias:** recuerdan tu elección sobre el banner de cookies.
- **Analíticas:** nos ayudan a entender cómo se usa la plataforma (solo si las aceptas).

## Cómo gestionarlas
Puedes elegir "Solo necesarias" en el banner o borrar las cookies desde la configuración de tu navegador.`,
  },
  {
    slug: 'envios-y-devoluciones',
    titulo: 'Envíos y devoluciones',
    contenido: `## Cobertura
Realizamos envíos a los 22 departamentos de Guatemala mediante transportadoras aliadas. El costo y el tiempo estimado se calculan según el departamento de destino.

## Tipos de pago
- **Contraentrega:** pagas al recibir tu pedido.
- **Prepagado:** pagas en línea al momento de comprar.

## Novedades
Si la transportadora no logra entregar (cliente ausente, dirección incorrecta), te contactaremos para coordinar una nueva entrega.

## Devoluciones
Si rechazas el pedido al momento de la entrega, el producto regresa al proveedor y el costo del flete se descuenta al vendedor. Para cambios por defecto de fábrica, contacta a la tienda dentro de los 7 días siguientes a la entrega.`,
  },
];
