import {protectedAdminAreas, rolePermissions, staffRoles} from "@/lib/permissions";

export default function PermissionsPage() {
  return (
    <main className="space-y-8">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#C95F3D]">
          Access control
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#101712]">
          Permissions matrix
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[#1E2420]/70">
          Role and permission plan for the proper auth phase. Current access is
          still protected by the temporary staff password gate, so these permissions
          are planning rules until real auth is connected.
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        {staffRoles.map((role) => (
          <article key={role} className="rounded-[1.5rem] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-[#101712]">{role}</h2>
            <ul className="mt-4 grid gap-2">
              {rolePermissions[role].map((permission) => (
                <li
                  key={permission}
                  className="rounded-2xl bg-[#F8F1E7] px-4 py-3 text-sm font-semibold text-[#1E2420]/75"
                >
                  {permission}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black text-[#101712]">Protected admin areas</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#101712]/10 text-xs uppercase tracking-[0.18em] text-[#1E2420]/50">
                <th className="py-3 pr-4">Area</th>
                <th className="py-3 pr-4">Allowed roles</th>
                <th className="py-3 pr-4">Note</th>
              </tr>
            </thead>
            <tbody>
              {protectedAdminAreas.map((area) => (
                <tr key={area.area} className="border-b border-[#101712]/10">
                  <td className="py-4 pr-4 font-black">{area.area}</td>
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
                  <td className="py-4 pr-4 text-[#1E2420]/65">{area.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
