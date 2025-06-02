-- Tabla para almacenar las suscripciones push de los docentes
CREATE TABLE IF NOT EXISTS suscripciones_push (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  docente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índice para búsquedas rápidas por docente
  CONSTRAINT unique_docente_subscription UNIQUE (docente_id, (subscription->>'endpoint'))
);

-- Políticas de seguridad de RLS para suscripciones_push
ALTER TABLE suscripciones_push ENABLE ROW LEVEL SECURITY;

-- Política para permitir a todos leer
CREATE POLICY "Todos pueden leer las suscripciones" 
  ON suscripciones_push FOR SELECT 
  USING (true);

-- Política para permitir a usuarios autenticados insertar sus propias suscripciones
CREATE POLICY "Usuarios pueden crear sus propias suscripciones" 
  ON suscripciones_push FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = docente_id);

-- Política para permitir a usuarios autenticados actualizar sus propias suscripciones
CREATE POLICY "Usuarios pueden actualizar sus propias suscripciones" 
  ON suscripciones_push FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = docente_id);

-- Política para permitir a usuarios autenticados eliminar sus propias suscripciones
CREATE POLICY "Usuarios pueden eliminar sus propias suscripciones" 
  ON suscripciones_push FOR DELETE 
  TO authenticated 
  USING (auth.uid() = docente_id);

-- Trigger para actualizar automáticamente el campo updated_at
CREATE OR REPLACE FUNCTION update_suscripciones_push_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_suscripciones_push_updated_at
BEFORE UPDATE ON suscripciones_push
FOR EACH ROW
EXECUTE FUNCTION update_suscripciones_push_updated_at();
