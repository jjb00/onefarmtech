import AdminPageShell from "@/components/AdminPageShell";
import {protectedAdminAreas, rolePermissions, staffRoles} from "@/lib/permissions";

export default function PermissionsPage() {
  return (
    <AdminPageShell
      title="Permissions matrix"
      description="Role and permission plan for the proper auth phase. Current access is still protected by the temporary staff password gate, so these permissions are planning rules until real auth is connected."
    >
      <div className="grid gap-6">
        <section className="grid gap-4 lg:grid-cols-2">
          {staffRoles.map((role) => (
            <article
              key={role}
              className="rounded-[2rem] border border-[#102015]/10 bg-white p-6 text-[#102015] shadow-sm"
            >
              <h2 className="text-xl font-black text-[#102015]">{role}</h2>

              <ul className="mt-4 grid gap-2">
                {rolePermissions[role].map((permission) => (
                  <li
                    key={permission}
                    className="rounded-2xl bg-[#f3f8ef] px-4 py-3 text-sm font-semibold text-[#405348]"
                  >
                    {permission}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="rounded-[2rem] border border-[#102015]/10 bg-white p-6 text-[#102015] shadow-sm">
          <h2 className="text-2xl font-black text-[#102015]">
            Protected admin areas
          </h2>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#102015]/10 text-xs uppercase tracking-[0.18em] text-[#587063]">
                  <th className="py-3 pr-4">Area</th>
                  <th className="py-3 pr-4">Allowed roles</th>
                  <th className="py-3 pr-4">Note</th>
                </tr>
              </thead>

              <tbody>
                {protectedAdminAreas.map((area) => (
                  <tr key={area.area} className="border-b border-[#102015]/10">
                    <td className="py-4 pr-4 font-black text-[#102015]">
                      {area.area}
                    </td>

                    <td className="py-4 pr-4">
                      <div className="flex flex-wrap gap-2">
                        {area.requiredRoles.map((role) => (
                          <span
                            key={role}
                            className="rounded-full bg-[#3E7A4C]/10 px-3 py-1 text-xs font-bold text-[#3E7A4C]"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-4 pr-4 text-[#405348]">{area.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminPageShell>
  );
}
