# AdminPay

Administrador personal de gastos hecho con **React + Vite + TypeScript**.

## Funciones

- **Login con PIN de 4 dígitos.** Se crea la primera vez. Se bloquea solo por inactividad y por 30 s tras 5 intentos fallidos.
- **Sueldo mensual.** Se puede registrar automáticamente cada mes al llegar el día de pago.
- **Gastos por categoría:** comida, fiesta, juegos, web, IA, luz, agua, gas y cosas para casa.
- **Ingresos nuevos:** extra, freelance, venta, regalo y otro.
- **Montos ahorrados y acumulados:** lo que te sobra cada mes (ingresos − gastos) y el total acumulado mes a mes.
- **Cuenta de ahorro separada:** puedes depositar o retirar desde tu dinero disponible y definir una meta.
- Tema claro y oscuro, diseño para celular y escritorio, y respaldo en JSON (exportar e importar).

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
```

> `package.json` reemplaza Rollup por `@rollup/wasm-node` porque Windows Smart App Control bloquea el binario nativo de Rollup. Funciona igual en Vercel.

## Subir a Vercel

**Opción A: desde GitHub (recomendada)**

1. Sube este repo a GitHub.
2. En [vercel.com/new](https://vercel.com/new), importa el repo. Vercel detecta **Vite** solo (build `npm run build`, salida `dist`).
3. Haz clic en Deploy. Cada `git push` vuelve a desplegar el sitio.

**Opción B: desde la terminal**

```bash
npm i -g vercel
vercel          # preview
vercel --prod   # producción
```

## Dónde se guardan los datos

Todo se guarda en el `localStorage` del navegador de cada dispositivo. No hay servidor, así que el celular y la PC no comparten datos. Para pasarlos de uno a otro, usa *Ajustes → Exportar / Importar respaldo*.

El PIN se guarda como hash SHA-256 con sal. Sirve para que nadie vea la app abierta en tu dispositivo, pero no cifra los datos.
