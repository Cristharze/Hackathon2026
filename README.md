# Hackathon2026
Desafio FUNDARES: ¿Es posible transformar conversaciones, fotos y mensajes dispersos en información estructurada y útil para medir impacto ambiental? Este reto se enfocará en automatización, extracción de datos y generación de métricas desde canales de comunicación cotidianos.

Recolector escribe en WhatsApp
        ↓
WhatsApp envía el mensaje a una URL de tu servidor (webhook)
        ↓
Tu servidor lo recibe en tiempo real
        ↓
Lo procesas con IA

🔴 Capa 4 — ¿Y si manda una foto?
Si el recolector manda una foto de una planilla o de los materiales, se usa Vision AI (GPT-4o o Claude que ven imágenes). Le mandas la foto y le preguntas lo mismo — la IA la "lee" como si fuera texto y extrae los mismos datos.

⚠️ El punto crítico
La IA no es perfecta. A veces puede:

Confundir una empresa con otra
No entender una cantidad mal escrita
No reconocer bien una foto borrosa

Por eso existe el módulo de validación de Fundares — un humano revisa antes de que los datos lleguen a las empresas. La IA hace el 90% del trabajo, Fundares corrige el 10%.
---

## Contexto del Proyecto — Hackathon InnovaHack Santa Cruz

**Empresa cliente:** Fundares (Bolivia) — sector sostenibilidad y gestión de residuos reciclables.

**Duración:** Hackathon de 48 horas, ya en curso.

**Equipo:** 6 personas — 2 ingenieros de sistemas, 1 mecatrónico, 2 industriales, 1 administración.

**Stack tecnológico:** React/Next.js (frontend), Node.js/Python (backend), APIs de IA (Claude/OpenAI), despliegue web primero.

---

### El problema actual

Fundares gestiona el reciclaje de **22 empresas aliadas**. Un recolector tercerizado recoge los residuos físicamente y reporta cada recolección a Fundares enviando **mensajes de texto y fotos por WhatsApp Business** (sin formato fijo). Fundares procesa esa información manualmente en planillas y entrega un reporte de impacto a cada empresa cada 6 o 12 meses. Esto genera tres problemas:

1. La extracción y estructuración de datos es lenta, manual y propensa a errores.
2. Las empresas aliadas no tienen visibilidad de su reciclaje en tiempo real.
3. Fundares no tiene mecanismo para educar y acompañar a las empresas en sostenibilidad.

---

### La solución a construir

Una **plataforma web** con dos roles autenticados:

**Rol 1 — Fundares (admin):**
- Recibe automáticamente los datos extraídos de los mensajes WhatsApp del recolector
- Revisa, corrige y aprueba los datos antes de publicarlos
- Tiene vista global de todas las empresas y recolecciones

**Rol 2 — Empresa aliada:**
- Dashboard en tiempo real con tipo de material, cantidades y evolución temporal
- Métricas de impacto ambiental (CO₂ ahorrado, etc.) basadas en estándares internacionales
- Tips y recomendaciones personalizadas de mejora
- Módulo educativo opcional (infografías, cursos cortos, videos)
- Reporte de impacto anual generado automáticamente

---

### Flujo completo de la solución

```
Recolector manda WhatsApp (texto y/o foto)
        ↓
WhatsApp Business API envía el mensaje al servidor vía webhook
        ↓
IA (Claude/GPT-4o) extrae: empresa, fecha, material, cantidad
        ↓
Datos quedan en estado "pendiente de validación"
        ↓
Fundares revisa, corrige y aprueba
        ↓
Datos se publican en el dashboard de la empresa aliada
        ↓
Al cierre del año → reporte anual generado automáticamente
```

---

### Decisiones ya tomadas

- WhatsApp Business API como canal de entrada del recolector
- El formato de los mensajes lo define el equipo (no hay formato fijo actual)
- Métricas de impacto ambiental basadas en estándares internacionales
- La validación por Fundares actualiza directamente la base de datos
- El módulo educativo y los reportes quedan a criterio creativo del equipo
- El diseño visual queda a criterio del equipo (Fundares no tiene guía de marca estricta)

---

### Criterios de éxito del hackathon

1. Flujo completo funcionando: WhatsApp → extracción → validación → dashboard → reporte
2. Calidad de la extracción automática con IA (es el corazón del desafío)
3. UX clara e intuitiva para ambos roles
4. Uso innovador de tecnología (IA, visualización de datos, gamificación)
5. Arquitectura escalable y mantenible
6. Demo navegable presentado en 48 horas

---

