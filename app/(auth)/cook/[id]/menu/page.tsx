// TODO (TES-169): Date picker (today/tomorrow), dish grid, qty selector, floating cart bar
// Cart conflict modal when switching cooks — cartStore.cookId !== current cookId
export default async function CookMenuPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <p className="text-[#666]">Cook Menu: {id} (TES-169)</p>
    </div>
  )
}
