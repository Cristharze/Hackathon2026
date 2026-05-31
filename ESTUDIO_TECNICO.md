# Guía Técnica — Fundares Hackathon 2026
> Para estudiar antes de la presentación al jurado

---

## 1. ¿Qué construimos y por qué?

Fundares gestiona el reciclaje de 22 empresas aliadas. El problema real: el recolector mandaba fotos y mensajes de WhatsApp sin formato fijo, y Fundares los procesaba **manualmente** en planillas. Eso generaba:
- Errores humanos en la transcripción
- Retrasos de 6-12 meses para que las empresas vean sus datos
- Sin visibilidad en tiempo real

**Nuestra solución:** automatizar ese proceso con IA. El recolector sigue mandando WhatsApp igual que antes — nosotros procesamos todo automáticamente.

---

## 2. Arquitectura General

```
Recolector (WhatsApp)
        ↓
   Twilio API
        ↓
  Backend FastAPI (Python)
        ↓
   Claude IA (Anthropic)     ←→   Supabase Storage (imágenes)
        ↓
   Supabase (PostgreSQL)
        ↓
  Frontend Next.js
    ├── Admin Fundares
    └── Dashboard Empresa
```

### ¿Por qué este flujo?
- **Twilio**: permite recibir mensajes de WhatsApp como webhooks HTTP en minutos, sin aprobación de Meta
- **FastAPI**: rápido de desarrollar, automáticamente genera documentación, ideal para APIs
- **Claude (Anthropic)**: mejor capacidad de comprensión de lenguaje natural en español y visión de imágenes
- **Supabase**: PostgreSQL administrado con API REST automática, auth incluida, storage incluido
- **Next.js**: renderizado híbrido, API routes integradas, el estándar actual de React

---

## 3. Arquitectura Monolito Modular

```
backend/
├── main.py              ← Solo monta los routers. No tiene lógica
├── shared/
│   ├── database.py      ← Cliente HTTP a Supabase (único punto de acceso a BD)
│   └── models.py        ← Estructuras de datos (Pydantic)
└── modules/
    ├── extraccion/      ← Todo lo relacionado a Claude IA
    │   ├── extractor.py ← Llama a Claude, parsea respuesta
    │   └── prompts.py   ← Prompt del sistema separado (fácil de mejorar)
    ├── webhook/
    │   └── routes.py    ← Recibe mensajes de Twilio y Meta
    ├── recolecciones/
    │   ├── routes.py    ← Endpoints REST (aprobar, rechazar, listar)
    │   └── repository.py← Lógica de negocio + queries a BD
    ├── storage/
    │   └── service.py   ← Subida de imágenes a Supabase Storage
    └── simulador/
        └── routes.py    ← Endpoint para testing sin WhatsApp real
```

### ¿Por qué monolito modular y no microservicios?
Para un hackathon de 48 horas, los microservicios agregan complejidad innecesaria (múltiples deployments, comunicación entre servicios, etc.). El monolito modular da:
- **Una sola aplicación** fácil de deployar
- **Separación clara** de responsabilidades (cada módulo hace una cosa)
- **Sin acoplamiento**: si falla el storage, la extracción sigue funcionando
- **Escalable**: cuando crezca, cada módulo puede convertirse en microservicio

---

## 4. El Corazón: Extracción con IA

### ¿Cómo funciona?

1. El recolector manda: *"Sofia, 9kg de papel y 6kg de PET"*
2. El backend recibe el mensaje de Twilio
3. Se llama a Claude con un prompt específico
4. Claude responde con JSON estructurado:
```json
{
  "empresa": "Sofia",
  "materiales": [
    {"material": "papel", "cantidad": 9.0, "unidad": "kg"},
    {"material": "plástico PET", "cantidad": 6.0, "unidad": "kg"}
  ],
  "fecha": "2026-05-31",
  "confianza": "alta",
  "notas": null
}
```
5. Se busca "Sofia" en la tabla `empresas` con búsqueda fuzzy (ilike)
6. Se busca "papel" y "PET" en la tabla `materiales`
7. Se guarda en `recolecciones` + `detalle_recoleccion`

### ¿Por qué Claude y no ChatGPT?
- Claude tiene mejor comprensión del español latinoamericano
- Mejor en seguir instrucciones estructuradas (devolver solo JSON)
- claude-haiku-4-5 es el modelo más rápido y económico de Anthropic
- Soporta visión de imágenes con el mismo API

### ¿Qué pasa si la IA se equivoca?
Existe el módulo de validación de Fundares. La IA hace el ~90% del trabajo, Fundares corrige el 10%. Así diseñamos el sistema intencionalmente.

### ¿Qué pasa si manda una foto?
Se descarga la imagen, se convierte a base64 y se envía a Claude con instrucciones de visión. Claude "lee" la imagen como si fuera texto y extrae los mismos datos.

---

## 5. Base de Datos (Supabase/PostgreSQL)

### Tablas principales:

| Tabla | ¿Para qué? |
|---|---|
| `empresas` | Las 22 empresas aliadas de Fundares |
| `materiales` | Catálogo de materiales con factores ambientales (EPA/IPCC) |
| `recolecciones` | Cada mensaje recibido del recolector |
| `detalle_recoleccion` | Qué materiales y cuánto por recolección |
| `impacto_recoleccion` | CO₂, agua, energía calculados al aprobar |
| `metricas_mensuales` | Agregado mensual por empresa (para dashboard rápido) |
| `contribuyentes_externos` | Empresas no registradas que igual reciclan |
| `tips_empresa` | Recomendaciones personalizadas por empresa |
| `perfiles` | Vincula usuarios de Supabase Auth con su empresa |

### ¿Por qué la tabla `metricas_mensuales`?
En lugar de calcular las métricas en cada consulta del dashboard (que requeriría sumar miles de registros), guardamos el agregado mensual. El dashboard carga instantáneo.

### Factores ambientales
Basados en el **EPA WARM Model** y las **IPCC Guidelines**. Por ejemplo: 1 kg de aluminio reciclado = 9.13 kg CO₂ ahorrado. Estos son estándares internacionales reconocidos.

### Estados de una recolección:
```
PENDIENTE → EN_REVISION → APROBADO
                        ↘ RECHAZADO
```

---

## 6. Flujo de Autenticación

1. Login con email/contraseña en el frontend
2. Supabase Auth devuelve un JWT token
3. El frontend guarda el token en localStorage
4. En cada request, el frontend envía el token en el header `Authorization: Bearer <token>`
5. El backend del frontend verifica el token con Supabase Auth
6. Busca el perfil del usuario en la tabla `perfiles` para saber si es admin o empresa
7. Según el rol, muestra el dashboard de admin o el de empresa

### Usuarios del sistema:
- **admin@fundares.bo** → rol FUNDARES_ADMIN → ve todas las empresas
- **sofia@fundares.bo** → rol EMPRESA_ALIADA → solo ve datos de Sofia
- **ecomanager@fundares.bo** → rol EMPRESA_ALIADA → solo ve datos de Ecomanager

---

## 7. WhatsApp + Twilio

### ¿Por qué Twilio y no la API oficial de Meta?
La API oficial de Meta requiere aprobación del negocio (días/semanas). Twilio Sandbox permite empezar en 15 minutos, perfecto para el hackathon.

### ¿Cómo llega el mensaje al servidor?
1. Recolector manda WhatsApp al número de Twilio
2. Twilio hace un HTTP POST a nuestra URL (webhook)
3. El servidor recibe el formulario con `Body`, `From`, `MediaUrl0` (si hay imagen)
4. Se procesa y responde con XML vacío (Twilio lo requiere)

### Para el demo: ¿cualquiera puede mandar mensajes?
Sí, pero deben primero enviar `join passage-end` al número de Twilio para unirse al sandbox. Solo se hace una vez por número.

---

## 8. Seguridad

- **Variables de entorno**: todas las API keys en `.env`, nunca en el código
- **`.gitignore`**: el `.env` está excluido del repositorio
- **Service Key**: el backend usa la service_role key de Supabase (acceso total). El frontend usa la anon key (acceso limitado por RLS)
- **JWT tokens**: la autenticación usa tokens firmados por Supabase, no contraseñas en texto plano
- **Contraseñas**: hasheadas por Supabase Auth (bcrypt)

---

## 9. Escalabilidad

El sistema está diseñado para crecer:

| Ahora | A futuro |
|---|---|
| 22 empresas | Cientos de empresas |
| 1 recolector | Múltiples recolectores |
| Twilio Sandbox | Meta Cloud API oficial |
| Local + ngrok | Cloud (Render/AWS/GCP) |
| Monolito modular | Microservicios por módulo |

La arquitectura modular permite extraer cualquier módulo como microservicio independiente sin reescribir el código.

---

## 10. Preguntas Frecuentes del Jurado

**¿Por qué IA y no un formulario fijo?**
Porque el recolector ya tiene el hábito de mandar WhatsApp en lenguaje natural. Cambiar ese hábito requiere capacitación y resistencia al cambio. La IA se adapta al recolector, no al revés.

**¿Qué tan precisa es la extracción?**
En mensajes claros ("30kg de cartón en Sofia"), la confianza es >90%. En mensajes vagos, Claude indica confianza baja y Fundares revisa. El sistema nunca publica datos sin validación humana.

**¿Qué pasa si el recolector no tiene WhatsApp?**
El sistema tiene un endpoint `/simulate` para cargar datos manualmente con el mismo flujo de validación.

**¿Cuánto cuesta operarlo?**
- Supabase: gratis hasta 500MB
- Claude API: ~$0.001 por mensaje (claude-haiku)
- Twilio: $0.005 por mensaje de WhatsApp
- Para 22 empresas con 100 recolecciones/mes: menos de $5/mes

**¿Por qué no usan GPT-4?**
Claude tiene mejor performance en español, costo más bajo con claude-haiku, y el mismo soporte de visión. También es una decisión de diversificación de proveedores.

**¿Cómo se calculan las métricas de impacto?**
Usando los factores del modelo EPA WARM (Environmental Protection Agency - Waste Reduction Model) y las guías del IPCC. Por ejemplo: 1 kg de papel reciclado = 1.06 kg CO₂ ahorrado, 10 litros de agua, 0.017 árboles equivalentes.

**¿Es seguro guardar datos de empresas en la nube?**
Sí. Supabase usa PostgreSQL en AWS con encriptación en reposo y en tránsito. Los datos de cada empresa solo son accesibles por esa empresa (Row Level Security en producción).

**¿Qué hace diferente a su solución?**
1. **Zero-friction para el recolector**: no cambia su flujo de trabajo
2. **Validación humana antes de publicar**: la IA ayuda pero no decide sola
3. **Múltiples materiales en un mensaje**: extrae toda la información de una sola vez
4. **Imágenes almacenadas permanentemente**: para informes anuales y trazabilidad
5. **Contribuyentes externos**: registra empresas que reciclan sin ser aliadas formales

---

## 11. Stack Tecnológico Resumido

| Capa | Tecnología | Versión |
|---|---|---|
| Backend | Python + FastAPI | 3.14 / 0.115 |
| IA | Claude Haiku (Anthropic) | claude-haiku-4-5 |
| Base de datos | Supabase (PostgreSQL) | - |
| Storage | Supabase Storage | - |
| Auth | Supabase Auth | - |
| WhatsApp | Twilio Sandbox | - |
| Frontend Admin | Next.js + TypeScript | 14 |
| Frontend Empresa | Next.js + TypeScript | 14 |
| Estilos | Tailwind CSS | 3 |
| Deploy | Local + ngrok (demo) | - |
