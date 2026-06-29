CREATE OR REPLACE FUNCTION protect_seeded_super_admin()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' AND OLD.email = 'wisdomoustech@gmail.com' THEN
    RAISE EXCEPTION 'The seeded super admin cannot be deleted.'
      USING ERRCODE = '23514';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.email = 'wisdomoustech@gmail.com' THEN
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'The seeded super admin email cannot be changed.'
        USING ERRCODE = '23514';
    END IF;

    IF NEW.role IS DISTINCT FROM 'SUPER_ADMIN'::"userType" THEN
      RAISE EXCEPTION 'The seeded super admin role cannot be changed.'
        USING ERRCODE = '23514';
    END IF;

    IF NEW."isDisabled" IS TRUE THEN
      RAISE EXCEPTION 'The seeded super admin cannot be disabled.'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_seeded_super_admin_trigger ON users;

CREATE TRIGGER protect_seeded_super_admin_trigger
BEFORE UPDATE OR DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION protect_seeded_super_admin();
