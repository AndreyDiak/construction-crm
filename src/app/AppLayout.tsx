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
              borderRadius="md"
              bg={isActive ? 'blue.50' : 'transparent'}
              color={isActive ? 'blue.700' : 'gray.700'}
              fontWeight={isActive ? 'semibold' : 'medium'}
              fontSize="sm"
              _hover={{ bg: isActive ? 'blue.50' : 'gray.100' }}
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
    <Box minH="100vh" bg="gray.50">
      <Box
        as="header"
        bg="white"
        borderBottomWidth="1px"
        borderColor="gray.200"
        position="sticky"
        top="0"
        zIndex="sticky"
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
              <Box p="2" bg="blue.600" color="white" borderRadius="lg">
                <Icon>
                  <Building2 size={20} />
                </Icon>
              </Box>
              <Text fontWeight="bold" fontSize="lg" color="gray.900">
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

      <Box as="main" maxW="6xl" mx="auto" px={{ base: '4', md: '6' }} py="8">
        <Outlet />
      </Box>
    </Box>
  )
}
