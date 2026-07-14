// TODO (TES-172): Pre-load existing address, pin on map, edit label/default, save
export default async function EditAddressPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <p className="text-[#666]">Edit Address: {id} (TES-172)</p>
    </div>
  )
}
