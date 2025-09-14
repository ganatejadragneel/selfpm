import React from 'react';
import { Box, Text, Heading, DSButton, Card, CardHeader, CardBody, CardFooter, colors } from './index';

/**
 * Design System Showcase
 * Safe demonstration of all components working together
 * ZERO dependencies on existing codebase to avoid breaking changes
 */
export const DesignSystemShowcase: React.FC = () => {
  return (
    <Box p="xl" bg={colors.gray[50]} style={{ minHeight: '100vh' }}>
      <Box maxWidth="800px" style={{ margin: '0 auto' }}>
        <Heading level={1} style={{ marginBottom: '32px' }}>
          Simple Design System
        </Heading>
        
        <Text size="lg" color={colors.gray[600]} style={{ marginBottom: '48px' }}>
          Bulletproof component system built with TypeScript safety
        </Text>

        {/* Typography Section */}
        <Card variant="elevated" style={{ marginBottom: '24px' }}>
          <CardHeader title="Typography" subtitle="Text and heading components" />
          <CardBody>
            <Box style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Heading level={2}>Heading Level 2</Heading>
              <Heading level={3}>Heading Level 3</Heading>
              <Text size="lg">Large text for emphasis</Text>
              <Text size="md">Default medium text for body content</Text>
              <Text size="sm" color={colors.gray[500]}>Small text for captions</Text>
            </Box>
          </CardBody>
        </Card>

        {/* Buttons Section */}
        <Card variant="elevated" style={{ marginBottom: '24px' }}>
          <CardHeader title="Buttons" subtitle="Interactive button variants" />
          <CardBody>
            <Box style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <DSButton variant="primary">Primary</DSButton>
              <DSButton variant="secondary">Secondary</DSButton>
              <DSButton variant="outline">Outline</DSButton>
              <DSButton variant="ghost">Ghost</DSButton>
              <DSButton variant="danger">Danger</DSButton>
              <DSButton variant="success">Success</DSButton>
            </Box>
            <Box mt="lg" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <DSButton size="sm">Small</DSButton>
              <DSButton size="md">Medium</DSButton>
              <DSButton size="lg">Large</DSButton>
              <DSButton loading>Loading</DSButton>
            </Box>
          </CardBody>
        </Card>

        {/* Cards Section */}
        <Card variant="elevated" style={{ marginBottom: '24px' }}>
          <CardHeader title="Cards" subtitle="Different card variants and states" />
          <CardBody>
            <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <Card variant="elevated">
                <CardHeader title="Elevated Card" />
                <CardBody>
                  <Text>Default elevated appearance with shadow</Text>
                </CardBody>
              </Card>
              
              <Card variant="outlined">
                <CardHeader title="Outlined Card" />
                <CardBody>
                  <Text>Clean outlined appearance</Text>
                </CardBody>
              </Card>
              
              <Card variant="subtle">
                <CardHeader title="Subtle Card" />
                <CardBody>
                  <Text>Subtle background appearance</Text>
                </CardBody>
              </Card>
            </Box>
          </CardBody>
        </Card>

        {/* Interactive Card */}
        <Card variant="elevated" interactive style={{ marginBottom: '24px' }}>
          <CardHeader 
            title="Interactive Card" 
            subtitle="This card responds to hover"
            action={<DSButton size="sm" variant="ghost">Action</DSButton>}
          />
          <CardBody>
            <Text>This card has hover effects when interactive prop is enabled</Text>
          </CardBody>
          <CardFooter>
            <DSButton variant="primary" size="sm">Primary Action</DSButton>
            <DSButton variant="outline" size="sm" style={{ marginLeft: '8px' }}>Secondary</DSButton>
          </CardFooter>
        </Card>

        {/* Layout Demo */}
        <Card variant="elevated">
          <CardHeader title="Layout System" subtitle="Box component capabilities" />
          <CardBody>
            <Box display="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Box p="md" bg={colors.primary[50]} borderRadius="md">
                <Text size="sm" weight="medium">Flexible Layout</Text>
                <Text size="xs" color={colors.gray[600]}>Using Box component</Text>
              </Box>
              <Box p="md" bg={colors.success[50]} borderRadius="md">
                <Text size="sm" weight="medium">Token-Based</Text>
                <Text size="xs" color={colors.gray[600]}>Consistent spacing</Text>
              </Box>
            </Box>
          </CardBody>
        </Card>
      </Box>
    </Box>
  );
};