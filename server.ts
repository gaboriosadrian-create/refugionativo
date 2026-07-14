import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { Cabin, Booking, AppSettings } from './src/types.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// Path persistence
const cabinsPath = path.join(process.cwd(), 'cabins.json');
const bookingsPath = path.join(process.cwd(), 'bookings.json');
const settingsPath = path.join(process.cwd(), 'settings.json');

const defaultSettings: AppSettings = {
  appName: "Refugio Nativo",
  appSubtitle: "Cabañas & naturaleza",
  logoIcon: "trees", // trees, tent, mountain, palmtree, etc.
  address: "Camino del Bosque 1840, Patagonia Argentina",
  locationDetails: "Nos encontramos en el Camino del Bosque 1840, a solo 15 minutos del centro urbano de la localidad y a 8 minutos del lago principal.",
  googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Camino+del+Bosque+1840+Patagonia",
  hours: "Recepción: todos los días, 08:00 a 22:00 hs",
  phone: "+54 9 294 555 0138",
  whatsapp: "5492945550138",
  email: "gaboriosadrian@gmail.com"
};

const defaultCabins: Cabin[] = [
  {
    id: 1,
    name: "Cabaña Arrayán",
    image: "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=900&q=84",
    description: "Cálida cabaña para dos personas, con ventanales al bosque, cocina equipada y hogar a leña.",
    price: 78000,
    discount: 10,
    offer: "Escapada romántica",
    category: "couples",
    capacity: 2,
    rating: 4.9
  },
  {
    id: 2,
    name: "Cabaña Coihue",
    image: "https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=900&q=84",
    description: "Amplia cabaña familiar con dos habitaciones, parrilla privada y vistas panorámicas.",
    price: 112000,
    discount: 0,
    offer: "",
    category: "family",
    capacity: 5,
    rating: 4.8
  },
  {
    id: 3,
    name: "Cabaña Lenga",
    image: "https://images.unsplash.com/photo-1520984032042-162d526883e0?auto=format&fit=crop&w=900&q=84",
    description: "Diseño moderno integrado al paisaje, deck exterior y bañera con vista a las montañas.",
    price: 99000,
    discount: 15,
    offer: "15% temporada baja",
    category: "couples",
    capacity: 2,
    rating: 5.0
  },
  {
    id: 4,
    name: "Cabaña Ciprés",
    image: "https://images.unsplash.com/photo-1473445361085-b9a07f55608b?auto=format&fit=crop&w=900&q=84",
    description: "Comodidad para toda la familia, tres ambientes, juegos de mesa y jardín cercado.",
    price: 126000,
    discount: 8,
    offer: "Semana en familia",
    category: "family",
    capacity: 6,
    rating: 4.7
  },
  {
    id: 5,
    name: "Cabaña Ñire",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=84",
    description: "Refugio íntimo de estilo rústico, cama king, desayuno artesanal y patio privado.",
    price: 84000,
    discount: 0,
    offer: "",
    category: "couples",
    capacity: 2,
    rating: 4.9
  },
  {
    id: 6,
    name: "Cabaña Maitén",
    image: "https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?auto=format&fit=crop&w=900&q=84",
    description: "Cabaña luminosa para grupos, cocina completa, gran comedor y acceso directo al sendero.",
    price: 138000,
    discount: 12,
    offer: "4 noches al precio de 3",
    category: "family",
    capacity: 6,
    rating: 4.8
  }
];

function dateToISO(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

const today = new Date();
const defaultBookings: Booking[] = [
  {
    id: Date.now() - 2000,
    cabinId: 1,
    name: "Sofía Martínez",
    phone: "+54 9 11 4522 1098",
    email: "sofia@example.com",
    guests: 2,
    checkIn: dateToISO(addDays(today, 4)),
    checkOut: dateToISO(addDays(today, 7)),
    status: "confirmed",
    totalPrice: 210600, // effective price * 3 nights (78000 * 0.9 = 70200; 70200 * 3 = 210600)
    paymentMethod: "visa",
    paymentStatus: "paid"
  },
  {
    id: Date.now() - 1000,
    cabinId: 3,
    name: "Daniel Rojas",
    phone: "+54 9 341 558 9201",
    email: "daniel@example.com",
    guests: 2,
    checkIn: dateToISO(addDays(today, 10)),
    checkOut: dateToISO(addDays(today, 13)),
    status: "pending",
    totalPrice: 252450, // effective price * 3 nights (99000 * 0.85 = 84150; 84150 * 3 = 252450)
    paymentMethod: "mastercard",
    paymentStatus: "pending"
  }
];

// Load / Save Helpers
function loadCabins(): Cabin[] {
  try {
    if (fs.existsSync(cabinsPath)) {
      return JSON.parse(fs.readFileSync(cabinsPath, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading cabins file, using defaults:', err);
  }
  return defaultCabins;
}

function saveCabins(data: Cabin[]) {
  try {
    fs.writeFileSync(cabinsPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing cabins file:', err);
  }
}

function loadBookings(): Booking[] {
  try {
    if (fs.existsSync(bookingsPath)) {
      return JSON.parse(fs.readFileSync(bookingsPath, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading bookings file, using defaults:', err);
  }
  return defaultBookings;
}

function saveBookings(data: Booking[]) {
  try {
    fs.writeFileSync(bookingsPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing bookings file:', err);
  }
}

function loadSettings(): AppSettings {
  try {
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading settings file, using defaults:', err);
  }
  return defaultSettings;
}

function saveSettings(data: AppSettings) {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing settings file:', err);
  }
}

// In-Memory arrays initialized from files
let cabinsList = loadCabins();
let bookingsList = loadBookings();
let settingsData = loadSettings();

// Ensure files are written if they don't exist
if (!fs.existsSync(cabinsPath)) saveCabins(cabinsList);
if (!fs.existsSync(bookingsPath)) saveBookings(bookingsList);
if (!fs.existsSync(settingsPath)) saveSettings(settingsData);

// API Routes
app.get('/api/settings', (req, res) => {
  res.json(settingsData);
});

app.put('/api/settings', (req, res) => {
  const updatedSettings = req.body;
  settingsData = { ...settingsData, ...updatedSettings };
  saveSettings(settingsData);
  res.json({ success: true, settings: settingsData });
});

app.get('/api/cabins', (req, res) => {
  res.json(cabinsList);
});

app.put('/api/cabins/:id', (req, res) => {
  const cabinId = Number(req.params.id);
  const updatedData = req.body;
  const index = cabinsList.findIndex(c => c.id === cabinId);
  if (index !== -1) {
    cabinsList[index] = { ...cabinsList[index], ...updatedData };
    saveCabins(cabinsList);
    res.json({ success: true, cabin: cabinsList[index] });
  } else {
    res.status(404).json({ error: 'Cabaña no encontrada' });
  }
});

app.get('/api/bookings', (req, res) => {
  res.json(bookingsList);
});

// Conflict Checker
function hasConflict(cabinId: number, start: string, end: string, excludeId?: number): boolean {
  const startDate = new Date(start + 'T12:00:00');
  const endDate = new Date(end + 'T12:00:00');

  return bookingsList.some(b => {
    if (b.id === excludeId || b.cabinId !== cabinId || b.status === 'cancelled') return false;
    const bStart = new Date(b.checkIn + 'T12:00:00');
    const bEnd = new Date(b.checkOut + 'T12:00:00');
    return startDate < bEnd && endDate > bStart;
  });
}

app.post('/api/bookings', (req, res) => {
  const { cabinId, name, phone, email, guests, checkIn, checkOut, paymentMethod } = req.body;

  if (!cabinId || !name || !phone || !checkIn || !checkOut) {
    return res.status(400).json({ error: 'Faltan campos obligatorios para completar la reserva.' });
  }

  const cabin = cabinsList.find(c => c.id === cabinId);
  if (!cabin) {
    return res.status(404).json({ error: 'Cabaña no encontrada.' });
  }

  if (guests > cabin.capacity) {
    return res.status(400).json({ error: `La capacidad máxima de la cabaña es de ${cabin.capacity} huéspedes.` });
  }

  if (hasConflict(cabinId, checkIn, checkOut)) {
    return res.status(400).json({ error: 'Las fechas seleccionadas ya están reservadas. Elige otras fechas.' });
  }

  // Calculate nights
  const nights = Math.max(0, Math.round((new Date(checkOut + 'T12:00:00').getTime() - new Date(checkIn + 'T12:00:00').getTime()) / 86400000));
  const effectivePrice = Math.round(cabin.price * (1 - (cabin.discount || 0) / 100));
  const totalPrice = effectivePrice * nights;

  const newBooking: Booking = {
    id: Date.now(),
    cabinId,
    name,
    phone,
    email,
    guests,
    checkIn,
    checkOut,
    status: paymentMethod ? 'confirmed' : 'pending',
    totalPrice,
    paymentMethod: paymentMethod || undefined,
    paymentStatus: paymentMethod ? 'paid' : 'pending'
  };

  bookingsList.push(newBooking);
  saveBookings(bookingsList);

  res.status(201).json({ success: true, booking: newBooking });
});

app.post('/api/bookings/:id/status', (req, res) => {
  const bookingId = Number(req.params.id);
  const { status } = req.body; // 'pending' | 'confirmed' | 'cancelled'
  const index = bookingsList.findIndex(b => b.id === bookingId);

  if (index !== -1) {
    const booking = bookingsList[index];
    if (status === 'confirmed' && hasConflict(booking.cabinId, booking.checkIn, booking.checkOut, booking.id)) {
      return res.status(400).json({ error: 'Conflicto de fechas: ya existe otra reserva confirmada en este periodo.' });
    }
    bookingsList[index] = { 
      ...booking, 
      status,
      paymentStatus: status === 'confirmed' ? 'paid' : status === 'cancelled' ? 'refunded' : booking.paymentStatus
    };
    saveBookings(bookingsList);
    res.json({ success: true, booking: bookingsList[index] });
  } else {
    res.status(404).json({ error: 'Reserva no encontrada' });
  }
});

app.post('/api/admin/login', (req, res) => {
  const { pin } = req.body;
  if (pin === '1234') {
    res.json({ success: true, token: 'fake-admin-token-1234' });
  } else {
    res.status(401).json({ error: 'Código PIN incorrecto' });
  }
});

// Vite Setup / Static Assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
