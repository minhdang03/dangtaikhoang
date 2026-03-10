-- Insert CapCut service if not exists
INSERT INTO "Service" (id, name, type, icon) VALUES ('capcut', 'CapCut Pro', 'capcut', '✂️') ON CONFLICT (id) DO NOTHING;
