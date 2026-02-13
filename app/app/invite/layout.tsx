/**
 * Invite Layout
 *
 * Overrides global overflow:hidden on html/body
 * so the registration form can scroll on smaller screens.
 */
export default function InviteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <style>{`
        html, body {
          height: auto !important;
          overflow: auto !important;
        }
      `}</style>
      {children}
    </>
  )
}
