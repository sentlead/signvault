import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { SettingsForm } from '@/components/settings/SettingsForm'

export const metadata = { title: 'Settings — SignVault' }

export default async function SettingsPage() {
  const session = await auth()
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      plan: true,
      billingInterval: true,
      subscriptionStatus: true,
      currentPeriodEnd: true,
      stripeCustomerId: true,
    },
  })

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-sv-text dark:text-sv-dark-text mb-6">
        Settings
      </h1>
      <SettingsForm user={user!} />
    </div>
  )
}
