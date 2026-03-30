module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  roots: ["<rootDir>/mock"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
};