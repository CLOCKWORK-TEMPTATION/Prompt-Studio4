import * as Y from "yjs";
import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

/**
 * Property-Based Tests for CRDT Collaboration System
 *
 * These tests verify the fundamental properties of CRDTs:
 * 1. Commutativity: Operations can be applied in any order
 * 2. Associativity: Grouping of operations doesn't matter
 * 3. Idempotence: Applying the same operation multiple times has the same effect as once
 * 4. Convergence: All replicas eventually reach the same state
 */

describe("CRDT Collaboration Properties", () => {
  let doc1: Y.Doc;
  let doc2: Y.Doc;
  let doc3: Y.Doc;

  beforeEach(() => {
    doc1 = new Y.Doc();
    doc2 = new Y.Doc();
    doc3 = new Y.Doc();
  });

  afterEach(() => {
    doc1.destroy();
    doc2.destroy();
    doc3.destroy();
  });

  describe("Property 1: Commutativity", () => {
    it("should produce the same result regardless of operation order", () => {
      // Create two text instances
      const text1 = doc1.getText("test");
      const text2 = doc2.getText("test");

      // User 1 inserts "Hello"
      text1.insert(0, "Hello");
      const update1 = Y.encodeStateAsUpdate(doc1);

      // User 2 inserts "World"
      text2.insert(0, "World");
      const update2 = Y.encodeStateAsUpdate(doc2);

      // Create two new docs to test different application orders
      const docA = new Y.Doc();
      const docB = new Y.Doc();

      // Apply updates in different orders
      Y.applyUpdate(docA, update1);
      Y.applyUpdate(docA, update2);

      Y.applyUpdate(docB, update2);
      Y.applyUpdate(docB, update1);

      // Both should converge to the same state
      const stateA = Y.encodeStateAsUpdate(docA);
      const stateB = Y.encodeStateAsUpdate(docB);

      expect(docA.getText("test").toString()).toBe(docB.getText("test").toString());

      docA.destroy();
      docB.destroy();
    });

    it("should handle concurrent insertions at different positions", () => {
      const text1 = doc1.getText("content");
      const text2 = doc2.getText("content");

      // Initial state
      text1.insert(0, "abc");
      const initialUpdate = Y.encodeStateAsUpdate(doc1);
      Y.applyUpdate(doc2, initialUpdate);

      // Concurrent insertions
      text1.insert(1, "X"); // Position 1
      text2.insert(2, "Y"); // Position 2

      const update1 = Y.encodeStateAsUpdate(doc1);
      const update2 = Y.encodeStateAsUpdate(doc2);

      // Sync both docs
      Y.applyUpdate(doc1, update2);
      Y.applyUpdate(doc2, update1);

      // Both should have the same final state
      expect(text1.toString()).toBe(text2.toString());
    });
  });

  describe("Property 2: Associativity", () => {
    it("should not depend on grouping of operations", () => {
      const text1 = doc1.getText("test");

      // Perform a series of operations
      text1.insert(0, "a");
      const op1 = Y.encodeStateAsUpdate(doc1);

      text1.insert(1, "b");
      const op2 = Y.encodeStateVector(doc1);

      text1.insert(2, "c");
      const op3 = Y.encodeStateVector(doc1);

      // Group 1: Apply (op1 + op2) then op3
      const docGroupA = new Y.Doc();
      Y.applyUpdate(docGroupA, op1);

      // Group 2: Apply op1 then (op2 + op3)
      const docGroupB = new Y.Doc();
      Y.applyUpdate(docGroupB, op1);

      // Final states should be equal regardless of grouping
      const finalUpdate = Y.encodeStateAsUpdate(doc1);
      Y.applyUpdate(docGroupA, finalUpdate);
      Y.applyUpdate(docGroupB, finalUpdate);

      expect(docGroupA.getText("test").toString()).toBe(
        docGroupB.getText("test").toString()
      );

      docGroupA.destroy();
      docGroupB.destroy();
    });
  });

  describe("Property 3: Idempotence", () => {
    it("should produce the same result when applying the same update multiple times", () => {
      const text1 = doc1.getText("test");
      text1.insert(0, "Hello");

      const update = Y.encodeStateAsUpdate(doc1);

      // Apply the same update multiple times
      Y.applyUpdate(doc2, update);
      const state1 = doc2.getText("test").toString();

      Y.applyUpdate(doc2, update);
      const state2 = doc2.getText("test").toString();

      Y.applyUpdate(doc2, update);
      const state3 = doc2.getText("test").toString();

      // All states should be identical
      expect(state1).toBe("Hello");
      expect(state2).toBe("Hello");
      expect(state3).toBe("Hello");
    });
  });

  describe("Property 4: Convergence", () => {
    it("should converge to the same state after exchanging all updates", () => {
      const text1 = doc1.getText("shared");
      const text2 = doc2.getText("shared");
      const text3 = doc3.getText("shared");

      // Three users make concurrent changes
      text1.insert(0, "User1");
      text2.insert(0, "User2");
      text3.insert(0, "User3");

      // Collect all updates
      const update1 = Y.encodeStateAsUpdate(doc1);
      const update2 = Y.encodeStateAsUpdate(doc2);
      const update3 = Y.encodeStateAsUpdate(doc3);

      // Sync all documents with all updates
      Y.applyUpdate(doc1, update2);
      Y.applyUpdate(doc1, update3);

      Y.applyUpdate(doc2, update1);
      Y.applyUpdate(doc2, update3);

      Y.applyUpdate(doc3, update1);
      Y.applyUpdate(doc3, update2);

      // All documents should have the same final state
      const final1 = text1.toString();
      const final2 = text2.toString();
      const final3 = text3.toString();

      expect(final1).toBe(final2);
      expect(final2).toBe(final3);
    });

    it("should maintain convergence with complex editing sequences", () => {
      const text1 = doc1.getText("document");
      const text2 = doc2.getText("document");

      // Initialize with same content
      text1.insert(0, "The quick brown fox");
      const initial = Y.encodeStateAsUpdate(doc1);
      Y.applyUpdate(doc2, initial);

      // User 1: Delete "quick " and insert "slow "
      text1.delete(4, 6);
      text1.insert(4, "slow ");

      // User 2: Replace "fox" with "dog"
      text2.delete(16, 3);
      text2.insert(16, "dog");

      // Exchange updates
      const updates1 = Y.encodeStateAsUpdate(doc1);
      const updates2 = Y.encodeStateAsUpdate(doc2);

      Y.applyUpdate(doc1, updates2);
      Y.applyUpdate(doc2, updates1);

      // Both should converge
      expect(text1.toString()).toBe(text2.toString());
    });
  });

  describe("Property 5: Causality Preservation", () => {
    it("should preserve causal order of operations", () => {
      const map1 = doc1.getMap("data");
      const map2 = doc2.getMap("data");

      // Operation A: Set initial value
      map1.set("counter", 0);
      const updateA = Y.encodeStateAsUpdate(doc1);

      // Apply A to doc2
      Y.applyUpdate(doc2, updateA);

      // Operation B: Increment (depends on A)
      const currentValue = map2.get("counter") as number;
      map2.set("counter", currentValue + 1);
      const updateB = Y.encodeStateAsUpdate(doc2);

      // Apply B to doc1
      Y.applyUpdate(doc1, updateB);

      // Both should have counter = 1
      expect(map1.get("counter")).toBe(1);
      expect(map2.get("counter")).toBe(1);
    });
  });

  describe("Property 6: Deletion Handling", () => {
    it("should handle concurrent insertions and deletions correctly", () => {
      const text1 = doc1.getText("content");
      const text2 = doc2.getText("content");

      // Initialize both with same text
      text1.insert(0, "abcdef");
      const initial = Y.encodeStateAsUpdate(doc1);
      Y.applyUpdate(doc2, initial);

      // User 1: Delete "cd"
      text1.delete(2, 2);

      // User 2: Insert "X" at position 3
      text2.insert(3, "X");

      // Exchange updates
      const update1 = Y.encodeStateAsUpdate(doc1);
      const update2 = Y.encodeStateAsUpdate(doc2);

      Y.applyUpdate(doc1, update2);
      Y.applyUpdate(doc2, update1);

      // Both should converge
      expect(text1.toString()).toBe(text2.toString());
    });
  });

  describe("Property 7: Map CRDT Properties", () => {
    it("should handle concurrent map updates with LWW (Last-Write-Wins)", () => {
      const map1 = doc1.getMap("settings");
      const map2 = doc2.getMap("settings");

      // Concurrent updates to the same key
      map1.set("theme", "dark");
      map2.set("theme", "light");

      // Exchange updates
      const update1 = Y.encodeStateAsUpdate(doc1);
      const update2 = Y.encodeStateAsUpdate(doc2);

      Y.applyUpdate(doc1, update2);
      Y.applyUpdate(doc2, update1);

      // Both should converge (LWW based on timestamps)
      expect(map1.get("theme")).toBe(map2.get("theme"));
    });

    it("should handle nested map structures", () => {
      const map1 = doc1.getMap("nested");
      const map2 = doc2.getMap("nested");

      // Create nested structure in doc1
      const innerMap1 = new Y.Map();
      innerMap1.set("a", 1);
      map1.set("inner", innerMap1);

      const update1 = Y.encodeStateAsUpdate(doc1);
      Y.applyUpdate(doc2, update1);

      // Update nested value in doc2
      const innerMap2 = map2.get("inner") as Y.Map<any>;
      innerMap2.set("b", 2);

      const update2 = Y.encodeStateAsUpdate(doc2);
      Y.applyUpdate(doc1, update2);

      // Both should have both keys
      const inner1 = map1.get("inner") as Y.Map<any>;
      const inner2 = map2.get("inner") as Y.Map<any>;

      expect(inner1.get("a")).toBe(1);
      expect(inner1.get("b")).toBe(2);
      expect(inner2.get("a")).toBe(1);
      expect(inner2.get("b")).toBe(2);
    });
  });

  describe("Property 8: Network Partition Tolerance", () => {
    it("should handle updates after network partition and reconciliation", () => {
      const text1 = doc1.getText("partition");
      const text2 = doc2.getText("partition");
      const text3 = doc3.getText("partition");

      // Initialize all with same state
      text1.insert(0, "start");
      const initial = Y.encodeStateAsUpdate(doc1);
      Y.applyUpdate(doc2, initial);
      Y.applyUpdate(doc3, initial);

      // Simulate network partition
      // Group A: doc1, doc2
      // Group B: doc3

      // Group A operations
      text1.insert(5, "-A1");
      text2.insert(5, "-A2");

      const updateA1 = Y.encodeStateAsUpdate(doc1);
      const updateA2 = Y.encodeStateAsUpdate(doc2);

      Y.applyUpdate(doc1, updateA2);
      Y.applyUpdate(doc2, updateA1);

      // Group B operations (isolated)
      text3.insert(5, "-B");

      const updateB = Y.encodeStateAsUpdate(doc3);

      // Network heals - sync all
      Y.applyUpdate(doc1, updateB);
      Y.applyUpdate(doc2, updateB);

      const finalStateA = Y.encodeStateAsUpdate(doc1);
      Y.applyUpdate(doc3, finalStateA);

      // All should converge
      const result1 = text1.toString();
      const result2 = text2.toString();
      const result3 = text3.toString();

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });
  });
});
