export default function IdentitySettings() {
  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-semibold mb-4">Enterprise SSO</h1>
      <p className="text-sm text-gray-600 mb-4">
        SSO is configured in Supabase Auth (SAML today). Role mapping arrives via IdP claims.
      </p>
      <a className="btn" href="https://app.supabase.com/project/_/auth/providers">
        Open Supabase Auth Providers
      </a>
      <p className="text-xs text-gray-500 mt-3">
        Use Supabase CLI to add SAML provider and map domains/attributes.
      </p>
    </div>
  );
}
