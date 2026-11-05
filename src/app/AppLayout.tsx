import { Box, Button, Flex, HStack, Icon, Text } from '@chakra-ui/react'
import { Building2, LogOut } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/auth-context'
import { RoleBadge } from '@/entities/profile/RoleBadge'

type NavItem = {
  to: string
  label: string
}

function NavItems({ items }: { items: NavItem[] }) {
  return (
    <HStack as="nav" gap="1" wrap="wrap">
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} style={{ textDecoration: 'none' }}>
          {({ isActive }) => (
            <Box
              px="3"
              py="2"
              borderRadius="lg"
              bg={isActive ? 'brand.subtle' : 'transparent'}
              color={isActive ? 'brand.fg' : 'gray.600'}
              fontWeight={isActive ? 'semibold' : 'medium'}
              fontSize="sm"
              transition="background 0.15s ease, color 0.15s ease"
              _hover={{
                bg: isActive ? 'brand.subtle' : 'bg.muted',
                color: isActive ? 'brand.fg' : 'gray.800',
              }}
            >
              {item.label}
            </Box>
          )}
        </NavLink>
      ))}
    </HStack>
  )
}

export function AppLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  if (!profile) {
    return null
  }

  const items: NavItem[] = [{ to: '/objects', label: 'Объекты' }]

  if (profile.role === 'executor') {
    items.push({ to: '/my-tasks', label: 'Мои задачи' })
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <Box minH="100vh" bg="bg.app">
      <Box
        as="header"
        bg="bg.surface/90"
        borderBottomWidth="1px"
        borderColor="border.subtle"
        position="sticky"
        top="0"
        zIndex="sticky"
        backdropFilter="blur(10px)"
      >
        <Flex
          maxW="6xl"
          mx="auto"
          px={{ base: '4', md: '6' }}
          minH="16"
          py="2"
          align="center"
          justify="space-between"
          gap="4"
          wrap="wrap"
        >
          <Flex align="center" gap="6" wrap="wrap">
            <Flex align="center" gap="2.5">
              <Box
                p="2"
                bg="brand.solid"
                color="white"
                borderRadius="lg"
                boxShadow="0 6px 16px rgba(47, 111, 107, 0.2)"
              >
                <Icon>
                  <Building2 size={18} />
                </Icon>
              </Box>
              <Text
                fontWeight="bold"
                fontSize="lg"
                color="gray.900"
                letterSpacing="-0.02em"
              >
                СтройCRM
              </Text>
            </Flex>
            <NavItems items={items} />
          </Flex>

          <Flex align="center" gap="3">
            <Box textAlign="right" display={{ base: 'none', sm: 'block' }}>
              <Text fontSize="sm" fontWeight="medium" color="gray.900">
                {profile.full_name}
              </Text>
            </Box>
            <RoleBadge role={profile.role} />
            <Button
              size="sm"
              variant="ghost"
              color="gray.600"
              _hover={{ bg: 'bg.muted', color: 'gray.900' }}
              onClick={() => {
                void handleSignOut()
              }}
            >
              <LogOut size={16} />
              <Text display={{ base: 'none', md: 'inline' }}>Выйти</Text>
            </Button>
          </Flex>
        </Flex>
      </Box>

      <Box as="main" maxW="6xl" mx="auto" px={{ base: '4', md: '6' }} py={{ base: '6', md: '8' }}>
        <Outlet />
      </Box>
    </Box>
  )
}
