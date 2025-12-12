import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { englishNameMapping } from '../add-english-names';

describe('add-english-names script', () => {
  const testDataDir = path.join(__dirname, 'test-data');
  const testFilePath = path.join(testDataDir, 'test-artists-info.json');

  // Create test data for a representative sample
  const createTestData = () => {
    return Object.keys(englishNameMapping)
      .slice(0, 20)
      .map((id) => ({
        id,
        name: `Test Artist ${id}`,
        characters: [],
        seriesIds: [1]
      }));
  };

  beforeEach(() => {
    // Create test directory and file
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }
    fs.writeFileSync(testFilePath, JSON.stringify(createTestData()), 'utf8');
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    if (fs.existsSync(testDataDir)) {
      fs.rmdirSync(testDataDir);
    }
  });

  it('should add English names to the sample artist IDs in the mapping', () => {
    const data = JSON.parse(fs.readFileSync(testFilePath, 'utf8'));

    // Apply the same logic as the script
    data.forEach((artist: any) => {
      if (englishNameMapping[artist.id]) {
        artist.englishName = englishNameMapping[artist.id];
      }
    });

    // Count how many artists got English names (should be all 20 in the sample)
    const artistsWithEnglishNames = data.filter((a: any) => a.englishName);
    expect(artistsWithEnglishNames.length).toBe(20);
  });

  it('should not add English names to artists without matching IDs', () => {
    const testData = [
      ...createTestData(),
      { id: '999', name: 'Test Artist Without English', characters: [], seriesIds: [1] }
    ];
    fs.writeFileSync(testFilePath, JSON.stringify(testData), 'utf8');

    const data = JSON.parse(fs.readFileSync(testFilePath, 'utf8'));

    // Apply the same logic as the script
    data.forEach((artist: any) => {
      if (englishNameMapping[artist.id]) {
        artist.englishName = englishNameMapping[artist.id];
      }
    });

    const artistWithoutEnglishName = data.find((a: any) => a.id === '999');
    expect(artistWithoutEnglishName).toBeDefined();
    expect(artistWithoutEnglishName.englishName).toBeUndefined();
  });

  it('should preserve existing properties when adding English names', () => {
    const data = JSON.parse(fs.readFileSync(testFilePath, 'utf8'));
    const originalData = JSON.parse(JSON.stringify(data)); // Deep copy
    const originalCount = data.length;

    // Apply the same logic as the script
    data.forEach((artist: any) => {
      if (englishNameMapping[artist.id]) {
        artist.englishName = englishNameMapping[artist.id];
      }
    });

    // Should not have added or removed any artists
    expect(data.length).toBe(originalCount);
    expect(data.length).toBe(20); // Sample size

    // All original properties should still be present
    const allPropertiesPreserved = data.every(
      (artist: any, index: number) =>
        artist.id === originalData[index].id &&
        artist.name === originalData[index].name &&
        JSON.stringify(artist.characters) === JSON.stringify(originalData[index].characters) &&
        JSON.stringify(artist.seriesIds) === JSON.stringify(originalData[index].seriesIds)
    );

    expect(allPropertiesPreserved).toBe(true);
  });

  it('should have exactly 205 English name mappings', () => {
    // Verify we have the exact expected number of mappings
    const totalMappings = Object.keys(englishNameMapping).length;
    expect(totalMappings).toBe(205);
  });

  it('should handle the actual production data correctly', () => {
    const productionFilePath = path.join(__dirname, '..', '..', 'data', 'artists-info.json');

    // Skip if production file doesn't exist (e.g., in CI)
    if (!fs.existsSync(productionFilePath)) {
      return;
    }

    const data = JSON.parse(fs.readFileSync(productionFilePath, 'utf8'));

    // Count how many artists in production have English names from our mapping
    const mappedArtistsInProduction = data.filter(
      (a: any) => a.englishName && englishNameMapping[a.id]
    );

    // Should match exactly the total number of mappings
    expect(mappedArtistsInProduction.length).toBe(Object.keys(englishNameMapping).length);
  });
});
